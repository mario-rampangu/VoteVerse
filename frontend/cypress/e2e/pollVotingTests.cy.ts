describe('Poll Voting Tests', () => {

    beforeEach(() => {
        // Assuming user is already logged in (optional: add login step if needed)
        cy.visit('http://localhost:3000/dashboard');  // Adjust URL if needed
    });

    it('Votes on a poll', () => {
        // Assuming polls are displayed after clicking a button
        cy.get('#fetchPollsButton').click();

        // Click first poll to open details
        cy.get('ul#pollList li').first().click();

        // Check we are on poll details page
        cy.url().should('include', '/pollDetails');

        // Select an option to vote
        cy.get('input[type="radio"]').first().check();

        // Submit vote
        cy.get('button#submitVoteButton').click();

        // Check success message
        cy.contains('Your vote has been submitted!').should('be.visible');
    });

    it('Prevents voting without selecting an option', () => {
        cy.get('#fetchPollsButton').click();
        cy.get('ul#pollList li').first().click();

        cy.get('button#submitVoteButton').click();

        cy.contains('Please select an option before voting').should('be.visible');
    });

});
