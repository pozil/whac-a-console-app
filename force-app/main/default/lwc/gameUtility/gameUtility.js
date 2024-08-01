/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import GAME_EVENT_CHANNEL from '@salesforce/messageChannel/Game_Event__c';
import {
    IsConsoleNavigation,
    openTab,
    closeTab
} from 'lightning/platformWorkspaceApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {
    EVENT_STATE_UPDATE,
    EVENT_TARGET_CLICK,
    STATE_STOPPED,
    STATE_STARTED,
    STATE_NEW_CYCLE,
    changeState,
    findTabWithApiName,
    highlightTabWithApiName
} from 'c/sharedCode';

const POINTS_VALID_TARGET = 10;
const POINTS_INVALID_TARGET = -10;
const POINTS_TARGET_EXPIRED = -5;

const CYCLE_DURATION = 2000;
const HOLD_DURATION = 500;

export default class GameUtility extends LightningElement {
    @wire(MessageContext) messageContext;
    @wire(IsConsoleNavigation) isConsoleNavigation;

    hasInteractedWithTarget;
    gameState = STATE_STOPPED;
    gameCycleTimeout;
    gameCycle = 0;
    gameCycleDuration = CYCLE_DURATION;
    score = 0;

    connectedCallback() {
        subscribe(this.messageContext, GAME_EVENT_CHANNEL, (event) =>
            this.handleGameEvent(event)
        );
    }

    executeGameCycle() {
        // Check if previous cycle ended with no target interaction
        if (this.gameCycle > 0 && !this.hasInteractedWithTarget) {
            const pointModifier = POINTS_TARGET_EXPIRED;
            highlightTabWithApiName('Game_Tab', 'warning', HOLD_DURATION);
            this.showToast(
                'Too Slow 😔',
                `You lose ${Math.abs(pointModifier)} points`,
                'warning'
            );
            this.score += pointModifier;
        }

        // Prepare new cycle
        console.log(`Game cycle ${this.gameCycle}`);
        changeState(this.messageContext, STATE_NEW_CYCLE);
        this.hasInteractedWithTarget = false;
        this.gameCycle++;
        this.gameCycleTimeout = setTimeout(
            () => this.executeGameCycle(),
            this.gameCycleDuration
        );
    }

    async startGame() {
        this.score = 0;
        this.gameCycle = -1;
        this.executeGameCycle();
    }

    stopGame() {
        clearTimeout(this.gameCycleTimeout);
    }

    handleGameEvent({ payload }) {
        console.log(payload);
        switch (payload.type) {
            case EVENT_STATE_UPDATE:
                this.handleGameStateUpdate(payload);
                break;
            case EVENT_TARGET_CLICK:
                this.handleTargetClick(payload);
                break;
            default:
                throw new Error(`Unsupported game event type: ${payload.type}`);
        }
    }

    handleGameStateUpdate({ state }) {
        switch (state) {
            case STATE_STARTED:
                this.startGame();
                break;
            case STATE_STOPPED:
                this.stopGame();
                break;
            case STATE_NEW_CYCLE:
                break;
            default:
                throw new Error(`Unsupported game state: ${state}`);
        }
        this.gameState = state;
    }

    async handleTargetClick({ isValidTargetHit }) {
        // Update points
        this.hasInteractedWithTarget = true;
        let pointModifier, toastTitle, toastMessage, state;
        if (isValidTargetHit) {
            pointModifier = POINTS_VALID_TARGET;
            toastTitle = 'Well Done 🤩';
            toastMessage = `You win ${pointModifier} points`;
            state = 'success';
        } else {
            pointModifier = POINTS_INVALID_TARGET;
            toastTitle = 'Wrong Target 😤';
            toastMessage = `You lose ${Math.abs(pointModifier)} points`;
            state = 'error';
        }
        this.score += pointModifier;
        // Show toast
        this.showToast(toastTitle, toastMessage, state);
        // Highlight tab temporarily
        highlightTabWithApiName('Game_Tab', state, HOLD_DURATION);
        // Force next cycle to kick in without minimul hold delay
        clearTimeout(this.gameCycleTimeout);
        setTimeout(() => {
            this.executeGameCycle();
        }, HOLD_DURATION);
    }

    async handleGameStopClick() {
        try {
            // Open welcome tab
            await openTab({
                url: '/lightning/n/Whac_a_Console_App_Welcome',
                focus: true,
                label: 'Welcome'
            });
            // Close game tab
            const gameTab = await findTabWithApiName('Game_Tab');
            if (gameTab) {
                await closeTab(gameTab.tabId);
            }
            // Change game state
            changeState(this.messageContext, STATE_STOPPED);
        } catch (error) {
            console.error('Failed to stop game ', JSON.stringify(error));
        }
    }

    async handleGameStartClick() {
        try {
            // Open game tab
            await openTab({
                url: '/lightning/n/Game_Tab',
                focus: true,
                label: 'Game',
                icon: 'action:new_campaign'
            });
            // Close welcome tab if open
            const welcomeTab = await findTabWithApiName(
                'Whac_a_Console_App_Welcome'
            );
            if (welcomeTab) {
                await closeTab(welcomeTab.tabId);
            }
            // Change game state
            changeState(this.messageContext, STATE_STARTED);
        } catch (error) {
            console.error('Failed to start game ', JSON.stringify(error));
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    get isGameStartButtonDisplayed() {
        return this.gameState === STATE_STOPPED;
    }

    get isGameStartButtonDisabled() {
        return !this.messageContext || !this.isConsoleNavigation;
    }

    get isGameStopButtonDisplayed() {
        return this.gameState !== STATE_STOPPED;
    }
}
