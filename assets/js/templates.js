const addTaskButton = `
	<div class="add-task">
		<span class="task__text">Add a task...</span>
	</div>
`;

const defaultTask = `
	<div class="task">
		<span class="task__text">some random text</span>
	</div>
`;

const taskBadges = `
	<div class="task__badges">
		<img src="assets/img/complete.svg" id="complete-task" alt="complete" />
		<img src="assets/img/delete.svg" id="remove-task" alt="delete" />
	</div>
`;

const reminderDialog = `
	<div class="reminder card">
			<span class="card__title"></span>
		</div>
	</div>
	<div class="button" id="close-reminder-dialog"><img src="assets/img/cancel.svg" alt="close-reminder"/></div>
`;

const createTaskDialog = `
	<span class="overlay__heading"></span>
	<div class="create-task card">
		<div class="cell cell1">
			<span class="cell__title">Title</span>
			<textarea class="cell__input" id="task-title" spellcheck="false"></textarea>
		</div>
		<div class="cell cell2">
			<span class="cell__title">Description</span>
			<textarea class="cell__input" id="task-description" spellcheck="false"></textarea>
			<span class="cell__title">Repeat</span>
			<div class="week-days">
				<div class="week-days__button button--off">M</div>
				<div class="week-days__button button--off">T</div>
				<div class="week-days__button button--off">W</div>
				<div class="week-days__button button--off">T</div>
				<div class="week-days__button button--off">F</div>
				<div class="week-days__button button--off">S</div>
				<div class="week-days__button button--off">S</div>
			</div>
		</div>
		<div class="cell cell3">
			<span class="cell__title">Time</span>
			<input class="cell__input" placeholder="00:00" id="task-time" autocomplete="off"></input>
			<div class="reminder-wrap hidden">
				<span class="cell__title">Reminder</span>
				<div class="button button--reminder button--off" data-reminder="false">off</div>
			</div>
		</div>
	</div>
	<div class="create-task__buttons">
		<div class="button" id="cancel"><img src="assets/img/cancel.svg" alt="cancel"/></div>
		<div class="button hidden" id="accept"><img src="assets/img/accept.svg" alt="accept" /></div>
	</div>
`;

const createTaskDialogSimple = `
	<span class="overlay__heading"></span>
	<div class="create-task">
		<div class="cell cell1">
			<span class="cell__title">Title</span>
			<textarea class="cell__input" id="task-title" spellcheck="false"></textarea>
		</div>
		<div class="cell cell2">
			<span class="cell__title">Description</span>
			<textarea class="cell__input" id="task-description" spellcheck="false"></textarea>
		</div>
		<div class="cell cell3">
			<span class="cell__title">Time</span>
			<input class="cell__input" placeholder="00:00" id="task-time" autocomplete="off" />
		</div>
	</div>
	<div class="create-task__buttons">
		<div class="button" id="cancel"><img src="assets/img/cancel.svg" alt="cancel" /></div>
		<div class="button hidden" id="accept"><img src="assets/img/accept.svg" alt="accept" /></div>
	</div>
`;
