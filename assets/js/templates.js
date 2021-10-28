const version = {
	release: "1.1.0",
	date: "October 2021",
};

const loadingScreen = `
	<div class="loading">
		<img class="loading__logo" src="assets/img/loading-logo.svg" alt="logo" />
		<span class="loading__details">V${version.release} - ${version.date}</span>
	</div>
`;

const reminderDialog = `
	<div class="reminder card">
		<span class="card__title"></span>
	</div>
	<div class="button button__close" id="close-reminder-dialog">
		<img src="assets/img/cancel.svg" alt="close-reminder"/>
	</div>
`;

const taskOptionsDialog = `
	<div class="card task-options">
		<span class="card__title"></span>
		<span class="task-options__option" id="complete-task">Complete task</span>
		<span class="task-options__option" id="remove-task">Remove task</span>
	</div>
	<div class="button button__close" id="close-task-options-dialog"><img src="assets/img/cancel.svg" alt="close-reminder"/></div>
`;

const signUp = `
	<div class="sign-up">
		<img src="assets/img/logo.svg" class="sign-up__logo" />
		<h1 class="sign-up__heading">Proton is your key to staying organized</h1>
		<span class="sign-up__blurb">
			With it’s light and simple interface, Proton will help you plan your weeks from now on. Add, modify, delete, even make recursive tasks so you’ll keep your schedule tight, all for
			free, no premium plans, no subscriptions.
		</span>
		<div class="button button--text" id="google-sign-in">Sign in with Google</div>
		<div class="button button--text hidden" id="sign-up__button">Take life one week at a time</div>
		<div class="sign-up__footer">
			<span>Designed & developed by <a href="https://github.com/vlad-solomon" target="_blank">Vlad Solomon</a></span>
			<span><a href="https://github.com/vlad-solomon/proton-calendar/pulls" target="_blank">Want to help?</a></span>
			<span>Proton Calendar ∣ ${moment().year()}</span>
			<span>V${version.release}</span>
		</div>
	</div>
`;

const createTaskDialog = `
	<span class="overlay__heading"></span>
	<div class="create-task card">
		<div class="cell cell1">
			<span class="cell__title">Title</span>
			<textarea class="cell__input" id="task-title" spellcheck="false" maxlength="100"></textarea>
		</div>
		<div class="cell cell2">
			<span class="cell__title">Description</span>
			<textarea class="cell__input" id="task-description" spellcheck="false" maxlength="200"></textarea>
		</div>
		<div class="cell cell4">
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
			<div class="time-wrap">
				<span class="cell__title">Time</span>
				<input class="cell__input" placeholder="00:00" id="task-time" autocomplete="off" type="tel"></input>
			</div>
			<div class="reminder-wrap hidden">
				<span class="cell__title">Reminder</span>
				<div class="button button--reminder button--off" data-reminder="false">off</div>
			</div>
		</div>
	</div>
	<div class="create-task__buttons">
		<div class="button button__close" id="cancel">
			<img src="assets/img/cancel.svg" alt="cancel"/>
		</div>
		<div class="button hidden" id="accept"><img src="assets/img/accept.svg" alt="accept" /></div>
	</div>
`;

const weatherDialog = `
	<span class="overlay__heading">Weather forecast</span>
	<div class="weather"></div>
	<div class="button button__close hidden" id="cancel-weather"><img src="assets/img/cancel.svg" alt="cancel" /></div>
`;

const settingsDialog = `
	<span class="overlay__heading">Settings</span>
	<div class="settings card">
		<div class="settings__sidebar">
			<div class="settings__option active">Personalization</div>
			<div class="settings__option">Account</div>
			<div class="settings__option">About</div>
			<div class="settings__option">FAQ</div>
			<div class="settings__option sign-out">Sign out</div>
		</div>
		<div class="settings__section" data-option="personalization">
			<span class="settings__group-title">Personalization</span>
			<div class="mobile-drawer">
				<span class="settings__title">Name</span>
				<div class="settings__group" data-setting="name">
					<div class="button button--setting button--off" data-option="short">Short</div>
					<div class="button button--setting button--off" data-option="long">Long</div>
					<div class="button button--setting button--off" data-option="email">Email</div>
				</div>
				<span class="settings__title">Theme</span>
				<div class="settings__group" data-setting="theme">
					<div class="button button--setting button--off" data-option="light">Light</div>
					<div class="button button--setting button--off" data-option="dark">Dark</div>
					<div class="button button--setting button--off" data-option="auto">Auto</div>
				</div>
				<span class="settings__title">Show "Someday"</span>
				<div class="settings__group" data-setting="showSomeday">
					<div class="button button--setting button--off" data-option="show">Show</div>
					<div class="button button--setting button--off" data-option="hide">Hide</div>
					<div class="button button--setting button--off" data-option="transparent">Transparent</div>
				</div>
			</div>
		</div>
		<div class="settings__section hidden" data-option="account">
			<span class="settings__group-title">Account</span>
			<div class="mobile-drawer">
				<span class="settings__title">Personal information</span>
				<span class="settings__text">Name <strong id="personal-name"></strong></span>
				<span class="settings__text">Email <strong id="personal-email"></strong></span>
				<span class="settings__text">Provider <strong id="personal-provider"></strong></span>
				<span class="settings__title">Disable account</span>
				<div class="settings__text">
					To disable your Proton Calendar account, press the button below. Be careful, as
					<strong>this action is permanent and cannot be undone</strong>. Note that your data will not be deleted immediately, but it will be unaccessible after this action is performed.
				</div>
				<div class="button button--warning" id="disable-user-account">Disable account</div>
			</div>
		</div>
		<div class="settings__section hidden" data-option="about">
			<span class="settings__group-title">About</span>
			<div class="mobile-drawer">
				<span class="settings__title">About Proton Calendar</span>
				<span class="settings__text"
					>Proton Calendar is a light-weight web application that syncs your data between all your devices. With it’s light and simple interface, Proton will help you plan your weeks from
					now on. Add, modify, delete, even make recursive tasks so you’ll keep your schedule tight!</span
				>
				<span class="settings__title">About the project</span>
				<div class="settings__text">
					Proton Calendar is being designed & developed by <a href="https://github.com/vlad-solomon" class="no-after" target="_blank">Vlad Solomon</a> using Moment.js and Firebase. The
					project is a public one, so anyone can help using the links below.
				</div>
				<div class="settings__text"><a href="https://github.com/vlad-solomon/proton-calendar" target="_blank">Github repo</a></div>
				<div class="settings__text"><a href="https://github.com/vlad-solomon/proton-calendar/pulls" target="_blank">Create a pull request</a></div>
				<div class="settings__text">
					If you want to support the project monetarily, you can donate directly to me <a href="https://www.buymeacoffee.com/vladsolomon" target="_blank">here</a>
				</div>
				<span class="settings__title">Version info</span>
				<div class="settings__text">V${version.release} - ${version.date}</div>
			</div>
		</div>
		<div class="settings__section hidden" data-option="faq">
			<span class="settings__group-title">Frequently asked questions</span>
			<div class="mobile-drawer">
				<span class="settings__title">How do I complete or remove a task?</span>
				<div class="settings__text">To complete or remove a task taphold or right click on it.</div>
				<span class="settings__title">How do I edit an existing task?</span>
				<div class="settings__text">Find the task you want to edit and click or tap on it and make any changes you would like to it.</div>
				<span class="settings__title">How do I repeat a task?</span>
				<div class="settings__text">
					When creating a task choose what days of the week you'll like the task to repeat on. To stop a task from being a repeated one unselect all the repeated days.
				</div>
				<span class="settings__title">Does deleting the root of a repeated task delete all of its repeating children?</span>
				<div class="settings__text">Yes. If you delete the original task, all its repeating children will also be removed.</div>
				<span class="settings__title">Does Proton have keyboard shortcuts?</span>
				<div class="settings__text">If you're on a device that supports keyboard inputs, you can use the shortcuts below to navigate Proton Calendar faster:</div>
				<div class="settings__text">Press <kbd>&larr;</kbd> or <kbd>&rarr;</kbd> to navigate backwards or forwards between weeks.</div>
				<div class="settings__text">Press <kbd>T</kbd> to jump to today.</div>
				<div class="settings__text">Press <kbd>W</kbd> to get the weather forecast.</div>
				<div class="settings__text">Press <kbd>Return</kbd> to apply any changes you've made.</div>
				<div class="settings__text">Press <kbd>Esc</kbd> to exit out of any dialog.</div>
				<span class="settings__title">Will Proton Calendar be free for everyone?</span>
				<div class="settings__text">Always and forever!</div>
			</div>
		</div>
		<div class="settings__section" id="mobile-signout">
			<span class="settings__group-title sign-out">Sign out</span>
		</div>
	</div>
	<div class="button button__close"><img src="assets/img/cancel.svg" alt="cancel" /></div>
`;
