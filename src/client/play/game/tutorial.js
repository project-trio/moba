import storage from '@/client/helpers/storage'
import store from '@/client/store'

import Local from '@/client/play/local'

import Unit from '@/client/play/game/entity/unit/unit'

let tutorialIndex

const destroyedTower = () => {
	for (const unit of Unit.all()) {
		if (unit.tower && unit.isDead) {
			return true
		}
	}
}

const Tutorial = {

	start () {
		tutorialIndex = -1
		this.advance()
	},

	advance () {
		tutorialIndex += 1
		store.state.game.tutorial = null
		const tutorial = this.data[tutorialIndex]
		if (tutorial) {
			window.setTimeout(() => {
				store.state.game.tutorial = tutorial
				if (tutorial.init) {
					tutorial.init(Local.unit)
				}
			}, tutorial.noDelay ? 0 : 1000)
		}
	},

	data: [
		{
			title: 'Welcome to moba!',
			body: `This quick tutorial will introduce the game and its controls.`,
			init (ship) {
				ship.stunnedUntil = 999999999
				ship.reemergeAt = 999999999
				ship.levelupSkill(0)
			},
			continue: true,
		},
		{
			title: 'Get moving',
			body: `Right click to move your ship and target enemy units. Left click to interact with UI or view a unit's stats at the bottom of the screen.`,
			init (ship) {
				ship.stunnedUntil = 0
			},
			check (ship) {
				return ship.oy - ship.py / 100 > 50
			},
		},
		{
			title: 'Activate "Rocket"',
			body: `Press down the "1" key to select "Rocket". Hover your mouse where you want to fire, and then release the key to activate.`,
			init (ship) {
				ship.reemergeAt = store.state.game.renderTime
			},
			check (ship) {
				return ship.skills.cooldowns[0] > 9
			},
		},
		{
			title: 'You leveled up!',
			body: `Click the red upgrade button (or press shift + 1/2/3) above one of your 3 abilities at the bottom of the screen to unlock it.`,
			init (ship) {
				ship.levelUp(0)
			},
			check (ship) {
				return ship.skills.leveled > 1
			},
		},
		{
			title: 'Target the tower',
			body: `You win the game by destroying your opponent's base. Get started by right clicking the nearest enemy (pink) tower to target it.`,
			init () {
				if (destroyedTower()) {
					Tutorial.advance()
				}
			},
			check (ship) {
				const target = ship.attackTarget
				return target && target.name === 'turret'
			},
		},
		{
			check (ship) {
				if (ship.isDead) {
					return true
				}
				if (destroyedTower()) {
					tutorialIndex += 2
					return true
				}
			},
		},
		{
			title: 'You died :(',
			body: `You've been sent back to base. Don't worry, you'll respawn quickly to try again.`,
			check (ship) {
				return !ship.isDead
			},
		},
		{
			title: 'Stay alive',
			body: `Towers attack whatever comes closer to them. Try clearing the enemy minions first and using yours for cover.`,
			init () {
				tutorialIndex -= 3
			},
			continue: true,
		},
		{
			title: 'Great work!',
			body: `Use your abilities to keep pushing into the base for the win. Here's a bunch of levels to make this quick!`,
			init (ship) {
				for (let i = 0; i < 24; i += 1) {
					ship.levelUp(0)
				}
			},
			continue: true,
		},
		{
			check () {
				return store.state.game.winningTeam !== null
			},
		},
		{
			title: 'You win!',
			body: `Okay, so maybe that was a little easy for you. Now you know the basics, you're ready to play against other people - and that's where the real fun begins!`,
			noDelay: true,
			init () {
				storage.set('tutorial', 1)
			},
			continue: true,
		},
	],

}

export default Tutorial
