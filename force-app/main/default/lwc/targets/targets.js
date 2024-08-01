import { LightningElement, wire } from 'lwc';
import { MessageContext, subscribe, publish } from 'lightning/messageService';
import GAME_EVENT_CHANNEL from '@salesforce/messageChannel/Game_Event__c';
import {
    EVENT_STATE_UPDATE,
    EVENT_TARGET_CLICK,
    STATE_NEW_CYCLE
} from 'c/sharedCode';

const TARGET_COUNT = 10;

const ICONS = [
    'utility:ban',
    'utility:block_visitor',
    'utility:away',
    'utility:bug',
    'utility:clear',
    'utility:contract',
    'utility:deprecate',
    'utility:error'
];
const ICON_TARGET = 'utility:campaign';
const ICON_SUCCESS = 'utility:check';
const ICON_FAIL = 'utility:close';

const BASE_CONTAINER_CLASSES =
    'slds-visual-picker__figure slds-visual-picker__icon slds-align_absolute-center';

function getRandomInvalidIcon() {
    return ICONS[Math.floor(Math.random() * ICONS.length)];
}

export default class Target extends LightningElement {
    @wire(MessageContext) messageContext;

    targets = [];
    isDisabled = false;
    selection;

    connectedCallback() {
        subscribe(this.messageContext, GAME_EVENT_CHANNEL, (event) =>
            this.handleGameEvent(event)
        );
    }

    handleGameEvent({ payload }) {
        if (
            payload.type === EVENT_STATE_UPDATE &&
            payload.state === STATE_NEW_CYCLE
        ) {
            this.generateTargets(TARGET_COUNT);
        }
    }

    generateTargets(targetCount) {
        // Force form reset
        this.template.querySelector('form').reset();
        // Generate targets
        const targets = [];
        const validIndex = Math.floor(Math.random() * targetCount);
        for (let i = 0; i < targetCount; i++) {
            const isValid = validIndex === i;
            let iconName, selectedIconName, containerClasses;
            if (isValid) {
                iconName = ICON_TARGET;
                selectedIconName = ICON_SUCCESS;
                containerClasses = `${BASE_CONTAINER_CLASSES} valid-item`;
            } else {
                iconName = getRandomInvalidIcon();
                selectedIconName = ICON_FAIL;
                containerClasses = `${BASE_CONTAINER_CLASSES} invalid-item`;
            }
            targets.push({
                id: i,
                isValid,
                iconName,
                selectedIconName,
                containerClasses
            });
        }
        this.targets = targets;
        this.isDisabled = false;
    }

    handleTargetClick(clickEvent) {
        if (this.isDisabled) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            return;
        }
        this.isDisabled = true;
        const isValidTargetHit = clickEvent.target.dataset.valid === 'true';
        const event = {
            payload: { type: EVENT_TARGET_CLICK, isValidTargetHit }
        };
        publish(this.messageContext, GAME_EVENT_CHANNEL, event);
    }
}
