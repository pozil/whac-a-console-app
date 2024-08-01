/* eslint-disable @lwc/lwc/no-async-operation */
import { publish } from 'lightning/messageService';
import GAME_EVENT_CHANNEL from '@salesforce/messageChannel/Game_Event__c';
import {
    getAllTabInfo,
    setTabHighlighted
} from 'lightning/platformWorkspaceApi';

export const EVENT_STATE_UPDATE = 'state-update';
export const EVENT_TARGET_CLICK = 'target-click';

export const STATE_STOPPED = 'stopped';
export const STATE_STARTED = 'started';
export const STATE_NEW_CYCLE = 'new-cycle';

export function changeState(messageContext, state) {
    const event = { payload: { type: EVENT_STATE_UPDATE, state } };
    publish(messageContext, GAME_EVENT_CHANNEL, event);
}

export async function findTabWithApiName(apiName) {
    const allTabs = await getAllTabInfo();
    const foundTab = allTabs.find(
        (tab) => tab.pageReference?.attributes.apiName === apiName
    );
    return foundTab;
}

export async function highlightTabWithApiName(apiName, state, duration) {
    const tab = await findTabWithApiName('Game_Tab');
    if (tab) {
        setTabHighlighted(tab.tabId, true, {
            pulse: true,
            state
        });
        setTimeout(() => {
            setTabHighlighted(tab.tabId, false);
        }, duration);
    }
}
