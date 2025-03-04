describe('Dashboard Page Tests', () => {

    beforeEach(() => {
        // Visit Dashboard before each test
        cy.visit('http://localhost:3000/dashboard'); 
    });

    it('Loads Dashboard and Displays Welcome Message', () => {
        cy.contains('h1', 'Welcome to Your Dashboard');
    });

    it('Fetch Polls Button Loads Polls', () => {
        cy.get('#fetchPollsButton').click();  // Simulate fetching polls

        // Confirm at least one poll is displayed in the list
        cy.get('ul#pollList li').should('have.length.greaterThan', 0);
    });

    it('Poll Item Click Opens Poll Details', () => {
        cy.get('#fetchPollsButton').click();

        cy.get('ul#pollList li').first().click();

        cy.url().should('include', '/pollDetails');

        cy.contains('h1', 'Poll Details');
    });

});
