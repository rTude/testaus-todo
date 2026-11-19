const STORAGE_KEY = 'todo_tasks_v1';

function seedTasks(tasks) {
  cy.window().then((win) => {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  });
  cy.reload();
}

function createTask({
  topic,
  priority = 'medium',
  status = 'todo',
  description = '',
}) {
  cy.get('#topic').clear().type(topic);
  cy.get('#priority').select(priority);
  cy.get('#status').select(status);
  cy.get('#description').clear();
  if (description) cy.get('#description').type(description);
  cy.get('#task-form').submit();
}

describe('Todo app requirements', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage(STORAGE_KEY);
    cy.reload();
  });

  it('FR-01 and FR-07: shows the initial form and empty state', () => {
    cy.title().should(
      'eq',
      'Basic CRUD ToDo web app for Testing in web applications course',
    );
    cy.get('#form-title').should('have.text', 'Create Task');
    cy.get('#topic').should('have.value', '').and('have.attr', 'maxlength', '120');
    cy.get('#priority').should('have.value', 'medium');
    cy.get('#status').should('have.value', 'todo');
    cy.get('#description').should('have.value', '');
    cy.get('#save-btn').should('have.text', 'Save Task');
    cy.get('#reset-btn').should('exist');
    cy.get('#task-list .task').should('not.exist');
    cy.get('#empty-state')
      .should('be.visible')
      .and('have.text', 'No tasks yet. Add your first task above.');
  });

  it('FR-02: creates a task and trims topic and description', () => {
    createTask({
      topic: '  Write E2E tests  ',
      priority: 'high',
      status: 'in-progress',
      description: '  Verify create flow  ',
    });

    cy.get('#task-list .task').should('have.length', 1);
    cy.get('#task-list .task').within(() => {
      cy.get('.title').should('have.text', 'Write E2E tests');
      cy.get('.desc').should('have.text', 'Verify create flow');
      cy.get('.prio-high').should('contain.text', 'High');
      cy.get('.badge').contains('In progress').should('exist');
    });
    cy.get('#empty-state').should('not.be.visible');
    cy.window().its('localStorage')
      .invoke('getItem', STORAGE_KEY)
      .should('not.be.null')
      .then((raw) => {
        const tasks = JSON.parse(raw);
        expect(tasks).to.have.length(1);
        expect(tasks[0]).to.include({
          topic: 'Write E2E tests',
          description: 'Verify create flow',
          priority: 'high',
          status: 'in-progress',
          completed: false,
        });
      });
  });

  it('FR-02: rejects a whitespace-only topic and focuses the field', () => {
    cy.get('#topic').type('   ');
    cy.get('#task-form').submit();

    cy.get('#topic').should('be.focused');
    cy.get('#task-list .task').should('not.exist');
  });

  it('FR-02: creates a done task in the completed state', () => {
    createTask({
      topic: 'Finished task',
      priority: 'low',
      status: 'done',
      description: 'Already complete',
    });

    cy.get('#task-list .task')
      .should('have.class', 'done')
      .and('contain.text', 'Done')
      .find('button[data-action="complete"]')
      .should('contain.text', 'Undo');
  });

  it('FR-03: reset restores the form defaults', () => {
    cy.get('#topic').type('Temporary');
    cy.get('#priority').select('high');
    cy.get('#status').select('blocked');
    cy.get('#description').type('Temporary description');
    cy.get('#reset-btn').click();

    cy.get('#form-title').should('have.text', 'Create Task');
    cy.get('#topic').should('have.value', '');
    cy.get('#priority').should('have.value', 'medium');
    cy.get('#status').should('have.value', 'todo');
    cy.get('#description').should('have.value', '');
    cy.get('#save-btn').should('have.text', 'Save Task');
  });

  it('FR-04: loads and updates every editable task field', () => {
    createTask({
      topic: 'Original',
      priority: 'low',
      status: 'todo',
      description: 'Original description',
    });

    cy.get('[data-action="edit"]').click();
    cy.get('#form-title').should('have.text', 'Edit Task');
    cy.get('#topic').should('have.value', 'Original');
    cy.get('#priority').should('have.value', 'low');
    cy.get('#status').should('have.value', 'todo');
    cy.get('#description').should('have.value', 'Original description');
    cy.get('#save-btn').should('have.text', 'Update Task');

    cy.get('#topic').clear().type('  Updated  ');
    cy.get('#priority').select('high');
    cy.get('#status').select('blocked');
    cy.get('#description').clear().type('  Updated description  ');
    cy.get('#task-form').submit();

    cy.get('#task-list .task').should('have.length', 1);
    cy.get('#task-list .task').within(() => {
      cy.get('.title').should('have.text', 'Updated');
      cy.get('.desc').should('have.text', 'Updated description');
      cy.get('.prio-high').should('contain.text', 'High');
      cy.get('.badge').contains('Blocked').should('exist');
    });
    cy.get('#form-title').should('have.text', 'Create Task');
    cy.get('#save-btn').should('have.text', 'Save Task');
  });

  it('FR-04: setting status to Done during edit completes the task', () => {
    createTask({ topic: 'Edit complete', status: 'in-progress' });
    cy.get('[data-action="edit"]').click();
    cy.get('#status').select('done');
    cy.get('#task-form').submit();

    cy.get('#task-list .task')
      .should('have.class', 'done')
      .and('contain.text', 'Done');
  });

  it('FR-04: does not allow a whitespace-only topic during edit', () => {
    createTask({ topic: 'Keep this task' });
    cy.get('[data-action="edit"]').click();
    cy.get('#topic').clear().type('   ');
    cy.get('#task-form').submit();

    cy.get('#topic').should('be.focused');
    cy.get('.task').should('have.length', 1).and('contain.text', 'Keep this task');
  });

  it('FR-05: complete and undo persist completion and status', () => {
    createTask({ topic: 'Toggle me', status: 'in-progress' });

    cy.get('[data-action="complete"]').click();
    cy.get('.task')
      .should('have.class', 'done')
      .and('contain.text', 'Done')
      .find('[data-action="complete"]')
      .should('contain.text', 'Undo');

    cy.get('[data-action="complete"]').click();
    cy.get('.task')
      .should('not.have.class', 'done')
      .and('contain.text', 'In progress')
      .find('[data-action="complete"]')
      .should('contain.text', 'Complete');

    cy.window().then((win) => {
      const tasks = JSON.parse(win.localStorage.getItem(STORAGE_KEY));
      expect(tasks[0].completed).to.equal(false);
      expect(tasks[0].status).to.equal('in-progress');
    });
  });

  it('FR-05: undoing a done task resets status to To do', () => {
    createTask({ topic: 'Undo done status', status: 'done' });
    cy.get('[data-action="complete"]').should('contain.text', 'Undo').click();

    cy.get('.task')
      .should('not.have.class', 'done')
      .and('contain.text', 'To do');
  });

  it('FR-06: canceling deletion keeps the task', () => {
    createTask({ topic: 'Keep on cancel' });
    cy.on('window:confirm', () => false);
    cy.get('[data-action="delete"]').click();
    cy.get('.task').should('have.length', 1).and('contain.text', 'Keep on cancel');
  });

  it('FR-06 and FR-07: confirming deletion removes the task and shows empty state', () => {
    createTask({ topic: 'Delete me' });
    cy.on('window:confirm', (message) => {
      expect(message).to.equal('Delete this task?');
      return true;
    });
    cy.get('[data-action="delete"]').click();

    cy.get('.task').should('not.exist');
    cy.get('#empty-state')
      .should('be.visible')
      .and('have.text', 'No tasks yet. Add your first task above.');
  });

  it('FR-08: renders all status and priority labels', () => {
    createTask({ topic: 'Low todo', priority: 'low', status: 'todo' });
    createTask({ topic: 'Medium progress', priority: 'medium', status: 'in-progress' });
    createTask({ topic: 'High blocked', priority: 'high', status: 'blocked' });

    cy.get('.task').should('have.length', 3);
    cy.get('.task').eq(0).should('contain.text', 'High blocked');
    cy.get('.task').eq(1).should('contain.text', 'Medium progress');
    cy.get('.task').eq(2).should('contain.text', 'Low todo');
  });

  it('FR-08: escapes HTML in topic and description', () => {
    createTask({
      topic: '<img src=x onerror=alert(1)>',
      description: '<script>window.injected=true</script>',
    });

    cy.get('.title').should('contain.text', '<img src=x onerror=alert(1)>');
    cy.get('.desc').should('contain.text', '<script>window.injected=true</script>');
    cy.get('.title img, .desc script').should('not.exist');
  });

  it('FR-09: sorts completed after not-completed and by priority', () => {
    seedTasks([
      { id: 'low', topic: 'Low active', priority: 'low', status: 'todo', description: '', completed: false, createdAt: 300, updatedAt: 300 },
      { id: 'medium', topic: 'Medium active', priority: 'medium', status: 'todo', description: '', completed: false, createdAt: 200, updatedAt: 200 },
      { id: 'high', topic: 'High active', priority: 'high', status: 'todo', description: '', completed: false, createdAt: 100, updatedAt: 100 },
      { id: 'done', topic: 'Completed task', priority: 'high', status: 'done', description: '', completed: true, createdAt: 400, updatedAt: 400 },
    ]);

    cy.get('.task').eq(0).should('contain.text', 'High active');
    cy.get('.task').eq(1).should('contain.text', 'Medium active');
    cy.get('.task').eq(2).should('contain.text', 'Low active');
    cy.get('.task').eq(3).should('contain.text', 'Completed task');
  });

  it('FR-09: sorts equal priority by newest first', () => {
    seedTasks([
      { id: 'old', topic: 'Older', priority: 'medium', status: 'todo', description: '', completed: false, createdAt: 100, updatedAt: 100 },
      { id: 'new', topic: 'Newer', priority: 'medium', status: 'todo', description: '', completed: false, createdAt: 200, updatedAt: 200 },
    ]);

    cy.get('.task').eq(0).should('contain.text', 'Newer');
    cy.get('.task').eq(1).should('contain.text', 'Older');
  });

  it('FR-10: persists tasks across reload', () => {
    createTask({
      topic: 'Persistent task',
      priority: 'high',
      status: 'blocked',
      description: 'Survives reload',
    });
    cy.reload();

    cy.get('.task').should('have.length', 1);
    cy.get('.title').should('have.text', 'Persistent task');
    cy.get('.desc').should('have.text', 'Survives reload');
  });

  it('FR-10: treats invalid or non-array localStorage data as empty', () => {
    cy.window().then((win) => {
      win.localStorage.setItem(STORAGE_KEY, '{invalid');
    });
    cy.reload();
    cy.get('.task').should('not.exist');

    cy.window().then((win) => {
      win.localStorage.setItem(STORAGE_KEY, JSON.stringify({ topic: 'not an array' }));
    });
    cy.reload();
    cy.get('.task').should('not.exist');
  });

  it('FR-11: exposes the application page and health footer link', () => {
    cy.get('h1').should(
      'have.text',
      'Basic CRUD ToDo web app for Testing in web applications course',
    );
    cy.get('.footnote a').should('have.attr', 'href', '/health').and('have.text', 'health');
  });

  it('FR-12: health endpoint returns ok', () => {
    cy.request('/health').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.deep.eq({ status: 'ok' });
    });
  });

  it('FR-13: version endpoint returns app metadata', () => {
    cy.request('/version').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.include({
        name: 'todo-training-app',
        version: '0.1.0',
      });
    });
  });
});
