describe('todo app', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage('todo_tasks_v1')
    cy.reload()
  })

  it('creates and completes a task', () => {
    cy.get('#topic').type('Write E2E test')
    cy.get('#priority').select('high')
    cy.get('#description').type('Verify the task flow in the app')
    cy.get('#task-form').submit()

    cy.get('#task-list .task').should('have.length', 1).within(() => {
      cy.get('.title').should('have.text', 'Write E2E test')
      cy.get('.desc').should('have.text', 'Verify the task flow in the app')
      cy.get('.prio-high').should('contain.text', 'High')
      cy.get('button[data-action="complete"]').click()
    })

    cy.get('#task-list .task')
      .should('have.class', 'done')
      .should('contain.text', 'Done')
      .find('button[data-action="complete"]')
      .should('contain.text', 'Undo')
  })
})