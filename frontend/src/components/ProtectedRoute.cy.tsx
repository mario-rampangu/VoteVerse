import React from 'react'
import ProtectedRoute from './ProtectedRoute'

describe('<ProtectedRoute />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<ProtectedRoute />)
  })
})