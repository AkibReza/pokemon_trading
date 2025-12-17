document.addEventListener("DOMContentLoaded", function () {
    const username = localStorage.getItem("username");
    const pokecoins = localStorage.getItem("pokecoins");

    if (!username) {
        window.location.href = "landing.html";
    } else {
        document.getElementById("userWelcome").textContent = `Welcome, ${username}!`;
        document.getElementById("pokecoinsValue").textContent = pokecoins || "0";
    }

    // Initialize music
    initMusic();

    loadUserDeck();
    loadBotDeck();
});

let userDeck = [];
let botDeck = [];
let userCards = []; // with current_hp
let botCards = [];
let selectedUserCard = null;
let battleLog = [];

function loadUserDeck() {
    fetch('/pokemon_trading/fetch_user_deck.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                userDeck = data.deck;
                // Initialize userCards
                const completeSlots = Object.values(userDeck).filter(card => card !== null);
                if (completeSlots.length < 6) {
                    alert('Your deck must have 6 cards to battle.');
                    return;
                }
                userCards = completeSlots.map(card => ({...card, current_hp: card.health}));
                renderUserDeckSetup();
            } else {
                alert('Error loading deck: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading deck');
        });
}

function loadBotDeck() {
    fetch('/pokemon_trading/generate_bot_deck.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                botDeck = data.bot_deck;
                // Initialize with current_hp
                botCards = botDeck.map(card => ({...card, current_hp: card.health}));
            } else {
                alert('Error loading bot deck: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading bot deck');
        });
}

function renderUserDeckSetup() {
    const deckContainer = document.getElementById('user-deck-setup');
    deckContainer.innerHTML = '';

    userCards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.innerHTML = `
            <img src="images/${card.image_url}" alt="${card.name}">
            <h3>${card.name}</h3>
            <p>HP: ${card.current_hp}/${card.health}</p>
            <p>Power: ${card.power}</p>
            <p>Type: ${card.type}</p>
        `;
        deckContainer.appendChild(cardDiv);
    });
}

document.getElementById('start-game').addEventListener('click', function() {
    document.getElementById('game-setup').style.display = 'none';
    document.getElementById('battle-arena').style.display = 'block';
    // Initialize battle log
    battleLog = ['Battle started! Select a card from your deck to begin.'];
    updateBattleLog();
    renderBotDeck();
    renderUserDeckDisplay();
});

function selectUserCard(index) {
    if (selectedUserCard !== null) {
        // Clear previous selection
        document.querySelectorAll('#user-deck-display .card.selected').forEach(card => card.classList.remove('selected'));
    }
    selectedUserCard = index;
    document.querySelector(`#user-deck-display .card[data-index="${index}"]`).classList.add('selected');
    
    // Place card in slot
    placeUserCardInSlot(index);
    
    // Bot selects card
    selectBotCard();
    
    // Show battle log and next round button
    updateBattleLog();
    document.getElementById('next-round').style.display = 'block';
}

function placeUserCardInSlot(index) {
    const card = userCards[index];
    const slot = document.getElementById('user-battle-slot');
    slot.classList.remove('empty');
    slot.classList.add('filled');
    slot.innerHTML = `
        <img src="images/${card.image_url}" alt="${card.name}">
        <h4>${card.name}</h4>
        <p>HP: ${card.current_hp}/${card.health}</p>
        <p>Power: ${card.power}</p>
        <p>Type: ${card.type}</p>
    `;
}

function selectBotCard() {
    if (botCards.length === 0) return;
    const botIndex = Math.floor(Math.random() * botCards.length);
    const card = botCards[botIndex];
    const slot = document.getElementById('bot-battle-slot');
    slot.classList.remove('empty');
    slot.classList.add('filled');
    slot.innerHTML = `
        <img src="images/${card.image_url}" alt="${card.name}">
        <h4>${card.name}</h4>
        <p>HP: ${card.current_hp}/${card.health}</p>
        <p>Power: ${card.power}</p>
        <p>Type: ${card.type}</p>
    `;
    
    // Perform battle
    performBattle(selectedUserCard, botIndex);
}

function performBattle(userIndex, botIndex) {
    const userCard = userCards[userIndex];
    const botCard = botCards[botIndex];

    battleLog = [];
    battleLog.push(`${userCard.name} vs ${botCard.name}`);

    let userDamage = 0;
    let botDamage = 0;

    if (userCard.power > botCard.power) {
        userDamage = botCard.power;
        botDamage = userCard.power;
        battleLog.push(`${userCard.name} has higher power!`);
        battleLog.push(`${userCard.name} takes ${userDamage} damage, ${botCard.name} takes ${botDamage} damage.`);
    } else if (botCard.power > userCard.power) {
        botDamage = userCard.power;
        userDamage = botCard.power;
        battleLog.push(`${botCard.name} has higher power!`);
        battleLog.push(`${botCard.name} takes ${botDamage} damage, ${userCard.name} takes ${userDamage} damage.`);
    } else {
        // Equal power, both take opponent's power damage
        userDamage = botCard.power;
        botDamage = userCard.power;
        battleLog.push(`Powers are equal!`);
        battleLog.push(`Both take ${userDamage} damage.`);
    }

    userCard.current_hp -= userDamage;
    botCard.current_hp -= botDamage;

    battleLog.push(`${userCard.name} HP: ${userCard.current_hp}, ${botCard.name} HP: ${botCard.current_hp}`);

    // Remove defeated cards
    if (userCard.current_hp <= 0) {
        battleLog.push(`${userCard.name} is defeated!`);
        userCards.splice(userIndex, 1);
    }
    if (botCard.current_hp <= 0) {
        battleLog.push(`${botCard.name} is defeated!`);
        botCards.splice(botIndex, 1);
    }

    updateBattleLog();

    // Check for winner
    if (userCards.length === 0 && botCards.length === 0) {
        showResult('Draw! No winner.', false);
    } else if (userCards.length === 0) {
        showResult('You lose! Bot wins.', false);
    } else if (botCards.length === 0) {
        showResult('You win! +100 PokeCoins', true);
        // Add coins
        addPokeCoins(100);
    } else {
        // Continue
        // Update decks
        renderBotDeck();
        renderUserDeckDisplay();
    }
}

function updateBattleLog() {
    const logDiv = document.getElementById('battle-log');
    logDiv.innerHTML = `
        <h4>Battle Log</h4>
        ${battleLog.map(line => `<p>${line}</p>`).join('')}
    `;
}

function showResult(message) {
    const resultDiv = document.getElementById('battle-result');
    resultDiv.innerHTML = `
        <p>${message}</p>
        <div class="result-buttons">
            <button id="play-again-btn" class="play-again-btn">Play Again</button>
            <button id="collection-btn" class="collection-btn">My Collection</button>
        </div>
    `;
    resultDiv.classList.toggle('lose', message.includes('lose'));
    resultDiv.style.display = 'block';
    document.getElementById('next-round').style.display = 'none';

    // Add event listeners
    document.getElementById('play-again-btn').addEventListener('click', playAgain);
    document.getElementById('collection-btn').addEventListener('click', goToCollection);
}

document.getElementById('next-round').addEventListener('click', function() {
    // Clear slots
    document.getElementById('user-battle-slot').className = 'battle-slot empty';
    document.getElementById('user-battle-slot').innerHTML = '<p>Your Card</p>';
    document.getElementById('bot-battle-slot').className = 'battle-slot empty';
    document.getElementById('bot-battle-slot').innerHTML = '<p>Bot\'s Card</p>';
    
    // Clear selection
    selectedUserCard = null;
    document.querySelectorAll('#user-deck-display .card.selected').forEach(card => card.classList.remove('selected'));
    
    // Hide next round button and battle result, but keep battle log visible
    document.getElementById('next-round').style.display = 'none';
    document.getElementById('battle-result').style.display = 'none';
    
    // Update decks
    renderBotDeck();
    renderUserDeckDisplay();
});

function addPokeCoins(amount) {
    fetch('/pokemon_trading/update_pokecoins.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amount }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            localStorage.setItem('pokecoins', data.new_pokecoins);
            document.getElementById('pokecoinsValue').textContent = data.new_pokecoins;
        } else {
            alert('Error updating PokeCoins: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating PokeCoins');
    });
}

function renderBotDeck() {
    const botDeckContainer = document.getElementById('bot-deck-display');
    botDeckContainer.innerHTML = '';

    botCards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card small-card';
        cardDiv.innerHTML = `
            <img src="images/${card.image_url}" alt="${card.name}">
            <h3>${card.name}</h3>
            <p>HP: ${card.current_hp}</p>
            <p>P: ${card.power}</p>
        `;
        botDeckContainer.appendChild(cardDiv);
    });
}

function renderUserDeckDisplay() {
    const userDeckContainer = document.getElementById('user-deck-display');
    userDeckContainer.innerHTML = '';

    userCards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card small-card';
        cardDiv.dataset.index = index;
        cardDiv.innerHTML = `
            <img src="images/${card.image_url}" alt="${card.name}">
            <h3>${card.name}</h3>
            <p>HP: ${card.current_hp}</p>
            <p>P: ${card.power}</p>
        `;
        cardDiv.addEventListener('click', () => selectUserCard(index));
        userDeckContainer.appendChild(cardDiv);
    });
}

function initMusic() {
    // Use global music manager
    musicManager.setPage('battle');

    const bgMusic = document.getElementById('bg-music');
    const battleMusic = document.getElementById('battle-music');
    const musicToggle = document.getElementById('music-toggle');

    if (!bgMusic || !battleMusic || !musicToggle) {
        console.error('Audio elements not found!');
        return;
    }

    // Set sources
    bgMusic.src = 'audio/background.mp3';
    battleMusic.src = 'audio/Battle_Music.mp3';

    // Preload audio
    bgMusic.load();
    battleMusic.load();

    // Set initial mute state
    bgMusic.muted = musicManager.isMuted;
    battleMusic.muted = musicManager.isMuted;
    musicToggle.textContent = musicManager.isMuted ? '🔇' : '🔊';

    // Play battle music
    setTimeout(() => {
        musicManager.playMusic('battle');
    }, 500);

    // Music toggle - instant on/off
    musicToggle.addEventListener('click', function() {
        musicManager.toggleMute();
    });
}

function playAgain() {
    // Reset game state
    userCards = userDeck.map(card => ({...card, current_hp: card.health}));
    botCards = botDeck.map(card => ({...card, current_hp: card.health}));
    selectedUserCard = null;
    battleLog = [];
    
    // Hide result and show setup
    document.getElementById('battle-result').style.display = 'none';
    document.getElementById('game-arena').style.display = 'none';
    document.getElementById('game-setup').style.display = 'block';
    
    // Reset battle slots
    document.getElementById('user-battle-slot').className = 'battle-slot empty';
    document.getElementById('user-battle-slot').innerHTML = '<p>Your Card</p>';
    document.getElementById('bot-battle-slot').className = 'battle-slot empty';
    document.getElementById('bot-battle-slot').innerHTML = '<p>Bot\'s Card</p>';
    
    // Clear selections
    document.querySelectorAll('.card.selected').forEach(card => card.classList.remove('selected'));
    
    // Re-render decks
    renderUserDeckSetup();
    renderBotDeck();
}

function goToCollection() {
    window.location.href = "collection.html";
}