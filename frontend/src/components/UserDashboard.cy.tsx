import React from 'react'
import UserDashboard from './UserDashboard'

describe('<UserDashboard />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<UserDashboard />)
  })
})