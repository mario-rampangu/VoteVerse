describe('SignUp Page Tests', () => {

    beforeEach(() => {
        cy.visit('http://localhost:3000/signup');  // Adjust URL if needed
    });

    it('Displays SignUp Form', () => {
        cy.contains('h1', 'Sign Up');  // Confirm heading exists
        cy.get('input[name="username"]').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        cy.get('input[name="confirmPassword"]').should('be.visible');
        cy.get('button[type="submit"]').should('contain', 'Sign Up');
    });

    it('Signs up successfully with valid data', () => {
        cy.get('input[name="username"]').type('NewUser');
        cy.get('input[name="email"]').type('newuser@example.com');
        cy.get('input[name="password"]').type('Password123');
        cy.get('input[name="confirmPassword"]').type('Password123');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/signin');  // Should redirect to SignIn page
        cy.contains('Sign In').should('be.visible');
    });

    it('Shows error for mismatched passwords', () => {
        cy.get('input[name="username"]').type('NewUser');
        cy.get('input[name="email"]').type('newuser@example.com');
        cy.get('input[name="password"]').type('Password123');
        cy.get('input[name="confirmPassword"]').type('Password321');
        cy.get('button[type="submit"]').click();

        cy.contains('Passwords do not match').should('be.visible');
    });

});
