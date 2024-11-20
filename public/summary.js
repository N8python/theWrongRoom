export class SummaryScreen {
    constructor(game) {
        this.game = game;
        this.createSummaryScreen();
    }

    createSummaryScreen() {
        const summaryScreen = document.createElement('div');
        summaryScreen.id = 'summary-screen';
        summaryScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(62, 47, 35, 0.95);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #3e2f23;
            border: 2px solid #e6d4b6;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            color: #e6d4b6;
        `;

        const title = document.createElement('h2');
        title.style.cssText = `
            font-size: 28px;
            margin-bottom: 24px;
        `;
        title.textContent = 'Interrogation Summary';

        const stats = document.createElement('div');
        stats.style.cssText = `
            font-size: 20px;
            margin-bottom: 32px;
        `;

        const returnButton = document.createElement('button');
        returnButton.className = 'clearance-button';
        returnButton.id = 'return-to-main-menu';
        returnButton.textContent = 'Return to Main Menu';
        returnButton.onclick = async() => {
            summaryScreen.style.display = 'none';
            await this.game.returnToMainMenu();
        };

        content.appendChild(title);
        content.appendChild(stats);
        content.appendChild(returnButton);
        summaryScreen.appendChild(content);
        document.body.appendChild(summaryScreen);

        this.summaryScreen = summaryScreen;
        this.statsElement = stats;
    }

    show(successCount, totalCount) {
        const rate = Math.round((successCount / totalCount) * 100);
        this.statsElement.innerHTML = `
            <p>Code words extracted: ${successCount}/${totalCount}</p>
            <p>Success rate: ${rate}%</p>
        `;
        this.summaryScreen.style.display = 'flex';
    }
}