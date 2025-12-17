import random
from typing import List, Dict, Tuple

# Card class
class Card:
    def __init__(self, name: str, hp: int, power: int, card_type: str):
        self.name = name
        self.max_hp = hp
        self.current_hp = hp
        self.power = power
        self.type = card_type

    def is_alive(self) -> bool:
        return self.current_hp > 0

    def take_damage(self, damage: int):
        self.current_hp = max(0, self.current_hp - damage)

    def heal(self, amount: int):
        self.current_hp = min(self.max_hp, self.current_hp + amount)

    def __str__(self):
        return f"{self.name} ({self.type}) - HP: {self.current_hp}/{self.max_hp}, Power: {self.power}"

# Type Effectiveness Matrix
TYPE_CHART = {
    'Grass': {'Fire': 2.0, 'Water': 0.5, 'Electric': 1.0, 'Earth': 2.0, 'Dark': 1.0, 'Psychic': 1.0},
    'Fire': {'Water': 2.0, 'Grass': 0.5, 'Electric': 1.0, 'Earth': 1.0, 'Dark': 1.0, 'Psychic': 2.0},
    'Water': {'Fire': 0.5, 'Electric': 2.0, 'Grass': 2.0, 'Earth': 1.0, 'Dark': 1.0, 'Psychic': 1.0},
    'Electric': {'Water': 0.5, 'Earth': 2.0, 'Grass': 1.0, 'Fire': 1.0, 'Dark': 1.0, 'Psychic': 2.0},
    'Earth': {'Electric': 0.5, 'Grass': 2.0, 'Water': 1.0, 'Fire': 2.0, 'Dark': 1.0, 'Psychic': 1.0},
    'Dark': {'Psychic': 2.0, 'Grass': 1.0, 'Fire': 1.0, 'Water': 1.0, 'Electric': 1.0, 'Earth': 1.0},
    'Psychic': {'Dark': 0.5, 'Grass': 1.0, 'Fire': 1.0, 'Water': 1.0, 'Electric': 1.0, 'Earth': 2.0}
}

def get_type_multiplier(attacker_type: str, defender_type: str) -> float:
    return TYPE_CHART.get(attacker_type, {}).get(defender_type, 1.0)

# Elemental Passives
PASSIVES = {
    'Fire': lambda card: random.random() < 0.3 and card.take_damage(5),  # 30% chance to burn (extra 5 damage)
    'Water': lambda card: card.heal(3) if card.is_alive() else None,  # Heal 3 HP if survives
    'Electric': lambda card: random.random() < 0.2,  # 20% chance to act first (speed advantage)
    'Grass': lambda card: card.heal(2),  # Regenerate 2 HP
    'Earth': lambda card: None,  # Tank: no special
    'Dark': lambda card: random.random() < 0.25 and card.power * 1.5,  # 25% chance power boost
    'Psychic': lambda card: random.random() < 0.2 and card.take_damage(-4),  # 20% chance to confuse (self damage)
}

# Player class
class Player:
    def __init__(self, name: str, deck: List[Card]):
        self.name = name
        self.deck = deck.copy()
        self.active_card = None
        self.has_switched = False

    def draw_card(self) -> Card:
        if self.deck:
            return self.deck.pop(0)
        return None

    def switch_card(self, new_card: Card):
        if not self.has_switched:
            self.active_card = new_card
            self.has_switched = True
            print(f"{self.name} switches to {new_card.name}")

    def is_alive(self) -> bool:
        return any(card.is_alive() for card in self.deck)

# Bot AI Classes
class BotAI:
    def choose_card(self, bot: Player, opponent: Player) -> Card:
        raise NotImplementedError

class AggressorAI(BotAI):
    def choose_card(self, bot: Player, opponent: Player) -> Card:
        # Always choose highest power card
        alive_cards = [card for card in bot.deck if card.is_alive()]
        return max(alive_cards, key=lambda c: c.power)

class TankAI(BotAI):
    def choose_card(self, bot: Player, opponent: Player) -> Card:
        # Choose highest HP card
        alive_cards = [card for card in bot.deck if card.is_alive()]
        return max(alive_cards, key=lambda c: c.current_hp)

class TacticianAI(BotAI):
    def choose_card(self, bot: Player, opponent: Player) -> Card:
        if opponent.active_card:
            # Choose card with best type advantage
            alive_cards = [card for card in bot.deck if card.is_alive()]
            best_card = max(alive_cards, key=lambda c: get_type_multiplier(c.type, opponent.active_card.type))
            return best_card
        else:
            # Default to highest power
            alive_cards = [card for card in bot.deck if card.is_alive()]
            return max(alive_cards, key=lambda c: c.power)

# Game class
class Game:
    def __init__(self, player: Player, bot: Player, bot_ai: BotAI):
        self.player = player
        self.bot = bot
        self.bot_ai = bot_ai
        self.round = 0

    def battle(self, player_card: Card, bot_card: Card) -> str:
        self.player.active_card = player_card
        self.bot.active_card = bot_card

        # Check for Electric speed advantage
        player_first = True
        if PASSIVES['Electric'](player_card):
            player_first = True
        elif PASSIVES['Electric'](bot_card):
            player_first = False

        attacker, defender = (self.player, self.bot) if player_first else (self.bot, self.player)
        attacker_card, defender_card = (player_card, bot_card) if player_first else (bot_card, player_card)

        # Calculate damage with type multiplier
        multiplier = get_type_multiplier(attacker_card.type, defender_card.type)
        base_damage = attacker_card.power
        damage = int(base_damage * multiplier)

        defender_card.take_damage(damage)

        # Apply passives
        PASSIVES[attacker_card.type](attacker_card)
        PASSIVES[defender_card.type](defender_card)

        result = f"{attacker.name}'s {attacker_card.name} attacks {defender.name}'s {defender_card.name} for {damage} damage (x{multiplier})"
        if not defender_card.is_alive():
            result += f"\n{defender_card.name} is defeated!"
            defender.deck.remove(defender_card)

        return result

    def play_round(self, player_choice: Card) -> str:
        self.round += 1
        bot_choice = self.bot_ai.choose_card(self.bot, self.player)

        log = f"Round {self.round}\n"
        log += f"{self.player.name} chooses {player_choice.name}\n"
        log += f"{self.bot.name} chooses {bot_choice.name}\n"
        log += self.battle(player_choice, bot_choice)

        return log

    def check_winner(self) -> str:
        if not self.player.is_alive():
            return f"{self.bot.name} wins!"
        elif not self.bot.is_alive():
            return f"{self.player.name} wins!"
        return None

# Simulation
def simulate_game():
    # Create sample decks
    player_deck = [
        Card("Charizard", 100, 90, "Fire"),
        Card("Blastoise", 110, 85, "Water"),
        Card("Venusaur", 105, 80, "Grass"),
        Card("Pikachu", 80, 95, "Electric"),
        Card("Golem", 120, 75, "Earth"),
        Card("Umbreon", 95, 85, "Dark")
    ]

    bot_deck = [
        Card("Arcanine", 95, 88, "Fire"),
        Card("Gyarados", 105, 82, "Water"),
        Card("Vaporeon", 100, 78, "Water"),
        Card("Raichu", 85, 92, "Electric"),
        Card("Sandslash", 115, 70, "Earth"),
        Card("Alakazam", 90, 88, "Psychic")
    ]

    player = Player("Player", player_deck)
    bot = Player("Bot", bot_deck)
    bot_ai = TacticianAI()  # Choose AI type

    game = Game(player, bot, bot_ai)

    while game.check_winner() is None:
        # Player chooses first card (in simulation, random)
        player_choice = random.choice([c for c in player.deck if c.is_alive()])
        log = game.play_round(player_choice)
        print(log)
        print()

    winner = game.check_winner()
    print(winner)

if __name__ == "__main__":
    simulate_game()