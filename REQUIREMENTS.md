# Application Requirements

This document defines the observable functionality that should be covered by end-to-end tests. It is derived from the current UI and implementation.

## Task form

### FR-01: Initial form state

- The task form is titled **Create Task**.
- Topic is empty and has a maximum length of 120 characters.
- Priority defaults to **Medium**.
- Status defaults to **To do**.
- Description is empty.
- The submit button is labeled **Save Task**.
- The **Reset** button is available.

### FR-02: Create a task

- A task can be created with topic, priority, status, and description fields.
- Topic is required. A whitespace-only topic must not create a task and the topic field must receive focus.
- Leading and trailing whitespace is removed from topic and description before saving.
- A task created with status **Done** is immediately completed.
- A created task is saved to browser `localStorage` under `todo_tasks_v1`.
- After saving, the form returns to its initial state and the task list is rendered again.

### FR-03: Reset the form

- Clicking **Reset** resets all form fields and the hidden task ID.
- The form title changes back to **Create Task**.
- Priority resets to **Medium**.
- Status resets to **To do**.
- The submit button changes back to **Save Task**.

### FR-04: Edit a task

- Clicking **Edit** loads the selected task's topic, priority, status, and description into the form.
- The form title changes to **Edit Task**.
- The submit button changes to **Update Task**.
- Saving an edit updates the existing task rather than creating another task.
- Topic remains required, and whitespace-only topics must not be saved.
- Setting status to **Done** marks the task as completed.
- Changing a done task away from **Done** leaves its completed flag unchanged.
- The updated task is saved to `localStorage`.

### FR-05: Complete and undo a task

- Clicking **Complete** toggles the task into the completed state.
- A completed task has the `done` CSS class, appears visually completed, and displays status **Done**.
- The task action button changes from **Complete** to **Undo**.
- Clicking **Undo** toggles the task back to not completed.
- When undoing a task that had status **Done**, status changes back to **To do**.
- When undoing a task whose status was not **Done**, its existing status is preserved.
- Completing or undoing a task persists the updated state in `localStorage`.

### FR-06: Delete a task

- Clicking **Delete** opens a browser confirmation dialog with the text **Delete this task?**.
- If deletion is cancelled, the task remains in the list.
- If deletion is confirmed, the task is removed from the list and `localStorage`.
- Deleting the last task shows the empty state.

## Task list

### FR-07: Empty state

- When no tasks exist, the list is empty and the text **No tasks yet. Add your first task above.** is displayed.
- When at least one task exists, the empty-state text is hidden.

### FR-08: Task display

- Each task displays topic and description.
- Each task displays a priority badge labeled Low, Medium, or High.
- Each task displays a status badge labeled To do, In progress, Blocked, or Done.
- A task's description may be blank.
- Task topic and description are rendered safely so HTML entered by the user is displayed as text, not executed.

### FR-09: Task sorting

- Tasks are sorted with not-completed tasks before completed tasks.
- Among tasks in the same completed group, High priority is before Medium priority, and Medium is before Low.
- Among tasks with the same completion state and priority, newer tasks are first.

### FR-10: Persistence across reload

- Tasks loaded from `localStorage` are rendered after page reload.
- No tasks are loaded when `todo_tasks_v1` is missing or contains invalid JSON.
- A non-array JSON value under `todo_tasks_v1` is treated as an empty task list.
- Changes to the task list remain after page reload.

## Server and page

### FR-11: Application page

- The application is available at `/` and renders the task form and task list.
- The page title is **Basic CRUD ToDo web app for Testing in web applications course**.
- The footer contains a link labeled **health**.

### FR-12: Health endpoint

- `GET /health` returns HTTP success and JSON `{ "status": "ok" }`.

### FR-13: Version endpoint

- `GET /version` returns HTTP success and JSON containing:
  - `name: "todo-training-app"`
  - `version: "0.1.0"`

## Suggested end-to-end scenarios

1. Verify initial form values and empty state.
2. Reject a whitespace-only topic.
3. Create a task for each priority and status.
4. Create a task with status Done and verify its completed presentation.
5. Edit every editable field and verify updated list and persistence.
6. Change a non-done task's status to Done and undo it.
7. Complete and undo a task; verify status and localStorage behavior.
8. Cancel and confirm task deletion.
9. Delete the final task and verify the empty state.
10. Reload the page and verify tasks remain.
11. Verify sorting by completion state, priority, and creation time.
12. Verify topic and description HTML is rendered safely.
13. Verify `/health` and `/version` responses.
