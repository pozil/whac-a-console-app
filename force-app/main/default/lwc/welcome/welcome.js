import { LightningElement, wire } from 'lwc';
import { getAllUtilityInfo, open } from 'lightning/platformUtilityBarApi';
import { IsConsoleNavigation } from 'lightning/platformWorkspaceApi';

export default class Welcome extends LightningElement {
    @wire(IsConsoleNavigation) isConsoleNavigation;

    gameUtility;

    async connectedCallback() {
        // Retrieve game utility bar
        const utilityInfos = await getAllUtilityInfo();
        if (utilityInfos.length === 0) {
            throw new Error('Failed to find Game utility bar');
        }
        this.gameUtility = utilityInfos[0];
    }

    handleGameReadyClick() {
        open(this.gameUtility.id);
    }

    get isGameReadyButtonDisabled() {
        return !this.gameUtility || !this.isConsoleNavigation;
    }
}
