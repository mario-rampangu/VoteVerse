describe('Auth Tests', () => {
    it('Signs in a user', () => {
        cy.visit('http://localhost:3000/signin');
        cy.get('input[name="username"]').type('TestUser');
        cy.get('input[name="password"]').type('Password123');
        cy.get('button[type="submit"]').click();
        cy.contains('Welcome, TestUser');  
    });
});
