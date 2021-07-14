const clockGreeting = $(".clock__greeting");
const clockTime = $(".clock__time");
const clockDate = $(".clock__date");
const calendarControls = $(".calendar-controls .button");
const overlay = $(".overlay");

let db = firebase.firestore();
let auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let unsubscribe, unsubscribeFromSomeday, unsubscribeFromRepeats;
let unsubscribeArray = [];

function unsubscribeFromPreviousWeek() {
	for (i = 0; i < unsubscribeArray.length; i++) {
		unsubscribeArray[i] && unsubscribeArray[i]();
	}
	unsubscribeArray = [];
}

let isReminding = false;
let todayIndex;
let today = moment().format("DD-MM-YYYY");
let week = moment().isoWeek();
let currentMonday = 1;
let remindersArray = [];
let hour = moment().hour();

setInterval(function () {
	setCurrentTime();
}, 1000);

function setCurrentTime() {
	let currentTime = moment().format("HH:mm:ss");
	clockTime.text(currentTime);

	document.title = isReminding ? "You've got a reminder!" : `Proton ∣ ${currentTime}`;
	checkIfMidnight();
}

//! using keyboard inputs here
//? important
//TODO: add universal class that all cancel buttons use that toggleOverlay("off")

//! overlay.hasClass("hidden") repeats a lot
function triggerClick(button) {
	$(button).trigger("click");
}

$(document).on("keydown", function (event) {
	switch (event.key) {
		case "ArrowLeft":
			if (overlay.hasClass("hidden")) {
				triggerClick("#prev");
			}
			break;
		case "ArrowRight":
			if (overlay.hasClass("hidden")) {
				triggerClick("#next");
			}
			break;
		case "t":
			if (!$("#today").hasClass("hidden") && overlay.hasClass("hidden")) {
				triggerClick("#today");
			}
			break;
		case "w":
			if (overlay.hasClass("hidden")) {
				triggerClick(".day__weather");
			}
			break;
		case "Escape":
			if (!overlay.hasClass("hidden")) {
				triggerClick(".button__close");
			}
			break;
	}
});

$(document).on("click", ".button__close", function () {
	toggleOverlay("off");
});

//! keyboard input end here

function setCurrentDate() {
	let currentDate = moment().isoWeek(week).format("[Week] W, YYYY");
	$(".week").attr("data-week-id", moment().isoWeek(week).format("W-YYYY"));
	clockDate.text(currentDate);
}

function generateWeek(monday) {
	unsubscribeFromPreviousWeek();
	$(".week").children().not(".someday").remove();
	for (let i = 0; i < 7; i++) {
		const day = `
			<div class="day" data-day-id="${moment()
				.isoWeekday(i + monday)
				.format("DD-MM-YYYY")}">
				<div class="day__head">
					<span class="day__date">${moment()
						.isoWeekday(i + monday)
						.format("dddd, DD.MM")}</span>
					<div class="day__badges"></div>
				</div>
				<div class="day__body">
					<div class="day__tasks-wrapper">
						<div class="add-task hidden">
							<span class="task__text">Add a task...</span>
						</div>
					</div>
				</div>
			</div>`;

		$(".week").append(day);
	}

	renderTasks();
	renderRepeatedTasks();
	checkToday();
}

function checkToday() {
	if (!$(`.day[data-day-id="${today}"]`).find(".day__badges").children(".day__today").length) {
		$(`.day[data-day-id="${today}"]`).find(".day__badges").prepend(`
			<span class="day__weather" data-html2canvas-ignore>Check weather</span>
			<span class="day__today" data-html2canvas-ignore>Today</span>`);
	}
	todayIndex = $(".day__today").parents().eq(2).index();
}

function checkIfMidnight() {
	if (clockTime.text() == "00:00:00") {
		today = moment().format("DD-MM-YYYY");
		week = moment().isoWeek();
		setCurrentDate();
		generateWeek(currentMonday);
		getReminders();
		checkIfCurrentWeek();
	}
}

function checkIfCurrentWeek() {
	if ($(".day__today").length) {
		$("#today").addClass("hidden");
	} else {
		$("#today").removeClass("hidden");
	}
}

$(document).on("mouseenter", ".day", function () {
	$(this).find(".add-task").removeClass("hidden");
});

$(document).on("mouseleave", ".day", function () {
	$(this).find(".add-task").addClass("hidden");
});

function toggleOverlay(condition) {
	switch (condition) {
		case "on":
			overlay.removeClass("hidden");
			break;
		case "off":
			overlay.addClass("hidden");
			overlay.children().remove();
			break;
	}
}

$(document).on("click", "#cancel", function () {
	repeatedDays = [];
	toggleOverlay("off");
	isEditingTask = false;
});

$(document).on("blur", "#task-time", function () {
	let inputValue = this.value;
	switch (inputValue.length) {
		case 1:
			this.value += "0:00";
			break;
		case 2:
			this.value += ":00";
			break;
		case 3:
			this.value += "00";
			break;
		case 4:
			this.value += "0";
			break;
	}
});

let greetingName;
function setGreeting() {
	if (hour >= 5 && hour < 12) {
		clockGreeting.text(`Good morning, ${greetingName}!`);
	} else if (hour >= 12 && hour < 17) {
		clockGreeting.text(`Good afternoon, ${greetingName}!`);
	} else {
		clockGreeting.text(`Good evening, ${greetingName}!`);
	}
}

function loadSettings() {
	$(".button--setting").addClass("button--off");
	for (const [key, value] of Object.entries(userObject.settings)) {
		$(`.settings__group[data-setting="${key}"]`).find(`.button[data-option="${value}"]`).removeClass("button--off");
	}
	$("#personal-name").text(userObject.name.long);
	$("#personal-email").text(userObject.email);
	$("#personal-provider").text(userObject.provider);
}

function applySettings() {
	switch (userObject.settings.name) {
		case "short":
			greetingName = userObject.name.short;
			break;
		case "long":
			greetingName = userObject.name.long;
			break;
		case "email":
			greetingName = userObject.email;
			break;
	}
	switch (userObject.settings.theme) {
		case "light":
			$("body").removeClass("dark-theme");
			break;
		case "dark":
			$("body").addClass("dark-theme");
			break;
	}
	switch (userObject.settings.showSomeday) {
		case "show":
			$(".day.someday").attr("class", "day someday");
			break;
		case "hide":
			$(".day.someday").attr("class", "day someday hidden");
			break;
		case "transparent":
			$(".day.someday").attr("class", "day someday transparent");
			break;
	}
	setGreeting();
}

function checkTasksLength() {
	$(".day").each(function () {
		let totalTasks = $(this).find(".task").length - $(this).find(".task.completed").length;
		if (totalTasks > 0) {
			$(this).find(".day__badges").find(".day__task").text(totalTasks);
			if ($(this).find(".day__badges").find(".day__task").length == 0) {
				$(this).find(".day__badges").append(`<span class="day__task">${totalTasks}</span>`);
			}
		} else {
			$(this).find(".day__badges").find(".day__task").remove();
		}
	});
}

let remainingMinute = (60 - moment().seconds()) * 1000;

$(document).on("click", "#google-sign-in", function () {
	auth.signInWithPopup(googleProvider).then(function (user) {
		if (user.additionalUserInfo.isNewUser) {
			db.collection("users")
				.doc(auth.currentUser.uid)
				.set({
					details: {
						longName: user.additionalUserInfo.profile.name,
						shortName: user.additionalUserInfo.profile.given_name,
						email: user.additionalUserInfo.profile.email,
						provider: user.additionalUserInfo.providerId,
					},
					settings: {
						name: "long",
						theme: "light",
						showSomeday: "show",
					},
				});
		}
	});
});

$(document).on("click", "#sign-out", function () {
	$("body").removeClass("dark-theme");
	toggleOverlay("off");
	$(".week").children().remove();
	auth.signOut();
	unsubscribeFromPreviousWeek();
	unsubscribeFromRepeats();
	unsubscribeFromSomeday();
});

let userRef, userObject;

auth.onAuthStateChanged(function (user) {
	if (user) {
		userRef = db
			.collection("users")
			.doc(auth.currentUser.uid)
			.get()
			.then((doc) => {
				userObject = {
					name: {
						long: doc.data().details.longName,
						short: doc.data().details.shortName,
					},
					email: doc.data().details.email,
					provider: doc.data().details.provider,
					settings: {
						name: doc.data().settings.name,
						theme: doc.data().settings.theme,
						showSomeday: doc.data().settings.showSomeday,
					},
				};
			})
			.then(() => {
				setCurrentTime();
				setCurrentDate();
				toggleOverlay("off");
				overlay.removeClass("overlay--sign-up");
				$(".clock").removeClass("hidden");
				renderSomedayTasks();
				generateWeek(currentMonday);
				getReminders();
				subscribeToRepeatedTasks();
				applySettings();
				setTimeout(function () {
					checkReminders();
					setGreeting();
					setInterval(function () {
						checkReminders();
						setGreeting();
					}, 60000);
				}, remainingMinute);
			});
	} else {
		toggleOverlay("on");
		overlay.addClass("overlay--sign-up");
		overlay.append(signUp);
	}
});

function renderTasks() {
	let currentWeek = $(".week").attr("data-week-id");
	$(".week")
		.children()
		.not(".someday")
		.each(function () {
			let currentDay = $(this).attr("data-day-id");
			unsubscribe = db
				.collection(`users/${auth.currentUser.uid}/weeks/${currentWeek}/${currentDay}`)
				.orderBy("createdAt", "asc")
				.onSnapshot((snapshot) => {
					let changes = snapshot.docChanges();
					changes.forEach((change) => {
						switch (change.type) {
							case "added":
								let task = `
									<div class="${change.doc.data().completed ? "task completed" : "task"}" data-task-id="${change.doc.id}">
										<div class="task__text">
											<span>${change.doc.data().title}</span>
										</div>
										<div class="task__time">${change.doc.data().time}</div>
									</div>`;
								$(`.day[data-day-id="${currentDay}"]`).find(".day__tasks-wrapper").prepend(task);
								break;
							case "removed":
								$(`.task[data-task-id="${change.doc.id}"]`).not(".repeated").remove();
								break;
							case "modified":
								$(`.task[data-task-id="${change.doc.id}"]`).toggleClass("completed", change.doc.data().completed);
								$(`.task[data-task-id="${change.doc.id}"]`).find(".task__text span").text(change.doc.data().title);
								$(`.task[data-task-id="${change.doc.id}"]`).find(".task__time").text(change.doc.data().time);
								break;
						}
						checkTasksLength();
					});
				});
			unsubscribeArray.push(unsubscribe);
		});
}

let isEditingTask = false;
let humanizedDate, selectedWeek, selectedDay;

$(document).on("click", ".day__tasks-wrapper > *", function () {
	humanizedDate = $(this).parents().eq(2).find(".day__head .day__date").text();

	toggleOverlay("on");
	overlay.append(createTaskDialog);
	$(".overlay__heading").text(humanizedDate);

	if ($(this).hasClass("someday")) {
		$(".create-task").addClass("someday");
	} else if ($(this).hasClass("repeated")) {
		$(".create-task").addClass("repeat previously-repeated");
	}

	taskTimeCleave = new Cleave("#task-time", {
		time: true,
		timePattern: ["h", "m"],
	});

	autosize($("textarea"));
});

$(document).on("click", ".add-task", function () {
	selectedWeek = $(".week").attr("data-week-id");
	selectedDay = $(this).parents().eq(2).attr("data-day-id");
	$("#task-title").focus();
});

$(document).on("keyup keydown click", ".create-task", function () {
	if (!isEditingTask) {
		$("#accept").toggleClass("hidden", $("#task-title").val().trim().length <= 0);
	} else {
		if ($("#task-title").val().trim().length > 0) {
			if (
				$("#task-title").val().trim() !== requestedDocument.title ||
				$("#task-description").val().trim() !== requestedDocument.description ||
				$("#task-time").val() !== requestedDocument.time ||
				JSON.parse($(".button--reminder").attr("data-reminder")) !== requestedDocument.reminder ||
				(!$(this).hasClass("someday") && repeatedDays.sort().toString() !== requestedDocument.repeats.toString())
			) {
				$("#accept").removeClass("hidden");
			} else {
				$("#accept").addClass("hidden");
			}
		} else {
			$("#accept").addClass("hidden");
		}
	}
	if ($("#task-time").val().length > 0) {
		$(".reminder-wrap").removeClass("hidden");
	} else {
		$(".reminder-wrap").addClass("hidden");
		$(".button--reminder").addClass("button--off").attr("data-reminder", "false").text("off");
	}
});

$(document).on("click", ".button--reminder", function () {
	$(this).toggleClass("button--off");
	if ($(this).hasClass("button--off")) {
		$(this).text("off").attr("data-reminder", "false");
	} else {
		$(this).text("on").attr("data-reminder", "true");
	}
});

let repeatedDays = [];

$(document).on("click", ".week-days__button", function () {
	if ($(this).hasClass("button--off")) {
		$(this).removeClass("button--off");
	} else {
		$(this).addClass("button--off");
	}
	repeatedDays = [];
	for (i = 0; i < $(".week-days__button").not(".button--off").length; i++) {
		repeatedDays.push($(".week-days__button").not(".button--off").eq(i).index() + 1);
	}
	if ($(".week-days__button.button--off").length < 7) {
		$(".create-task").addClass("repeat");
	} else {
		$(".create-task").removeClass("repeat");
	}
});

$(document).on("click", "#accept", function () {
	if (!$(".create-task").hasClass("someday") && !$(".create-task").hasClass("repeat") && !$(".create-task").hasClass("previously-repeated")) {
		if (!isEditingTask) {
			let createdTask = db.collection(`users/${auth.currentUser.uid}/weeks/${selectedWeek}/${selectedDay}`).doc();
			createdTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
					time: $("#task-time").val(),
					reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
					repeats: repeatedDays.sort(),
					completed: false,
					origin: {
						week: selectedWeek,
						day: selectedDay,
					},
					createdAt: moment().format("HH:mm:ss"),
				},
				{ merge: true }
			);
		} else {
			let existingTask = db.collection(`users/${auth.currentUser.uid}/weeks/${taskWeek}/${taskDay}`).doc(taskId);
			existingTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
					time: $("#task-time").val().trim(),
					reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
					repeats: repeatedDays.sort(),
				},
				{ merge: true }
			);
		}
	} else if (!$(".create-task").hasClass("someday") && ($(".create-task").hasClass("repeat") || $(".create-task").hasClass("previously-repeated"))) {
		if (!isEditingTask) {
			let repeatedTask = db.collection(`users/${auth.currentUser.uid}/repeats`).doc();
			repeatedTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
					time: $("#task-time").val(),
					reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
					repeats: repeatedDays.sort(),
					completed: false,
					removedArray: [],
					completedArray: [],
					origin: {
						week: selectedWeek,
						day: selectedDay,
					},
					createdAt: moment().format("HH:mm:ss"),
				},
				{ merge: true }
			);
		} else {
			let existingRepeatedTask = db.collection(`users/${auth.currentUser.uid}/repeats`).doc(taskId);
			existingRepeatedTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
					time: $("#task-time").val(),
					reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
					repeats: repeatedDays.sort(),
					completed: false,
					removedArray: requestedDocument.removedArray || [],
					completedArray: requestedDocument.completedArray || [],
					origin: {
						week: requestedDocument.origin.week,
						day: requestedDocument.origin.day,
					},
					createdAt: requestedDocument.createdAt,
				},
				{ merge: true }
			);
		}
	} else {
		if (!isEditingTask) {
			let somedayTask = db.collection(`users/${auth.currentUser.uid}/someday`).doc();
			somedayTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
					time: $("#task-time").val(),
					reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
					completed: false,
					createdAt: moment().format("HH:mm:ss"),
				},
				{ merge: true }
			);
		} else {
			let existingSomedayTask = db.collection(`users/${auth.currentUser.uid}/someday`).doc(taskId);
			existingSomedayTask.set(
				{
					title: $("#task-title").val().trim(),
					description: $("#task-description").val().trim(),
				},
				{ merge: true }
			);
		}
	}
	repeatedDays = [];
	getReminders();
	toggleOverlay("off");
	isEditingTask = false;
});

let taskWeek, taskDay, taskId, taskText, pathToTask;

$(document).on("click contextmenu", ".task", function () {
	taskWeek = $(".week").attr("data-week-id");
	taskDay = $(this).parents().eq(2).attr("data-day-id");
	taskId = $(this).attr("data-task-id");
	taskText = $(this).find(".task__text span").text();

	if ($(this).hasClass("someday")) {
		pathToTask = `users/${auth.currentUser.uid}/someday`;
	} else if ($(this).hasClass("repeated")) {
		pathToTask = `users/${auth.currentUser.uid}/repeats`;
	} else {
		pathToTask = `users/${auth.currentUser.uid}/weeks/${taskWeek}/${taskDay}`;
	}
});

let requestedDocument;

$(document).on("click", ".task", function () {
	isEditingTask = true;
	db.collection(pathToTask)
		.doc(taskId)
		.get()
		.then((doc) => {
			if (doc.exists) {
				requestedDocument = doc.data();
				if (requestedDocument.repeats && requestedDocument.repeats.length > 0) {
					const repeatWarning = `
						<div class="overlay__warning">
							<img src="assets/img/warning.svg" alt="warning">
							<p>This is a repeated task from ${requestedDocument.origin.day.replace(/-/g, ".")}<br>Any changes will modify the original task</p>
						</div>
					`;
					if (!$(this).hasClass("root-repeated")) {
						$(".overlay__heading").after(repeatWarning);
					}
				}
				$("#task-title").val(doc.data().title);
				$("#task-description").val(doc.data().description);
				$("#task-time").val(doc.data().time);
				if (doc.data().time) {
					$(".reminder-wrap").removeClass("hidden");
				}
				if (doc.data().reminder) {
					$(".button--reminder").removeClass("button--off").attr("data-reminder", "true").text("ON");
				}
				if (doc.data().repeats !== undefined && doc.data().repeats.length > 0) {
					repeatedDays = doc.data().repeats;
					for (i = 0; i < doc.data().repeats.length; i++) {
						$(".week-days__button")
							.eq(doc.data().repeats[i] - 1)
							.removeClass("button--off");
					}
				}
			}
		});
});

// * experimenting
$(document).on("contextmenu", ".task", function (event) {
	event.preventDefault();

	let taskDate = $(this).parents().eq(2).find(".day__head .day__date").text();
	taskDate = taskDate === "Someday" ? "someday" : taskDate;

	toggleOverlay("on");
	overlay.append(taskOptionsDialog);

	if ($(this).hasClass("someday")) {
		$(".task-options").addClass("someday");
	} else if ($(this).hasClass("repeated")) {
		$(".task-options").addClass("repeated");
		if ($(this).hasClass("root-repeated")) {
			$(".task-options").addClass("root-repeated");
		}
	}

	$(".task-options .card__title").text(`"${taskText}" from ${taskDate}`);
	if ($(this).hasClass("completed")) {
		$("#complete-task").text("Uncomplete task");
	}
});

$(document).on("click", ".task-options__option", function () {
	if (!$(".task-options").hasClass("repeated")) {
		switch ($(this).attr("id")) {
			case "complete-task":
				db.collection(pathToTask)
					.doc(taskId)
					.get()
					.then((doc) => {
						if (doc.exists) {
							doc.ref.update({
								completed: !doc.data().completed,
							});
						}
						getReminders();
					});
				break;
			case "remove-task":
				db.collection(pathToTask).doc(taskId).delete().then(getReminders);
				break;
		}
	} else {
		switch ($(this).attr("id")) {
			case "complete-task":
				db.collection(pathToTask)
					.doc(taskId)
					.get()
					.then((doc) => {
						if (doc.exists) {
							if (!doc.data().completedArray.includes(taskDay)) {
								doc.ref.update({
									completedArray: firebase.firestore.FieldValue.arrayUnion(taskDay),
								});
							} else {
								doc.ref.update({
									completedArray: doc.data().completedArray.filter((date) => date !== taskDay),
								});
							}
						}
						getReminders();
					});
				break;
			case "remove-task":
				if (!$(".task-options").hasClass("root-repeated")) {
					db.collection(pathToTask)
						.doc(taskId)
						.get()
						.then((doc) => {
							if (doc.exists) {
								doc.ref.update({
									removedArray: firebase.firestore.FieldValue.arrayUnion(taskDay),
								});
							}
							getReminders();
						});
				} else {
					db.collection(pathToTask).doc(taskId).delete().then(getReminders);
				}
				break;
		}
	}
	toggleOverlay("off");
});

$(document).on("click", "#close-task-options-dialog", function () {
	toggleOverlay("off");
	taskWeek = taskDay = taskId = taskText = null;
});

function renderSomedayTasks() {
	const someday = `
		<div class="day someday" data-day-id="someday">
			<div class="day__head">
				<span class="day__date">Someday</span>
				<div class="day__badges"></div>
			</div>
			<div class="day__body">
				<div class="day__tasks-wrapper">
					<div class="add-task hidden someday">
						<span class="task__text">Add a task...</span>
					</div>
				</div>
			</div>
		</div>`;

	$(".week").prepend(someday);

	unsubscribeFromSomeday = db
		.collection(`users/${auth.currentUser.uid}/someday`)
		.orderBy("createdAt", "asc")
		.onSnapshot((snapshot) => {
			let changes = snapshot.docChanges();
			changes.forEach((change) => {
				switch (change.type) {
					case "added":
						let task = `
							<div class="someday ${change.doc.data().completed ? "task completed" : "task"}" data-task-id="${change.doc.id}">
								<div class="task__text">
									<span>${change.doc.data().title}</span>
								</div>
							</div>
						`;
						$(`.day[data-day-id="someday"]`).find(".day__tasks-wrapper").prepend(task);
						break;
					case "removed":
						$(`.task[data-task-id="${change.doc.id}"]`).remove();
						break;
					case "modified":
						$(`.task[data-task-id="${change.doc.id}"]`).toggleClass("completed", change.doc.data().completed);
						$(`.task[data-task-id="${change.doc.id}"]`).find(".task__text span").text(change.doc.data().title);
						break;
				}
				checkTasksLength();
			});
		});
}

function subscribeToRepeatedTasks() {
	unsubscribeFromRepeats = db
		.collection(`users/${auth.currentUser.uid}/repeats`)
		.orderBy("createdAt", "asc")
		.onSnapshot((snapshot) => {
			let changes = snapshot.docChanges();
			changes.forEach((change) => {
				switch (change.type) {
					case "added":
						renderRepeatedTasks();
						break;
					case "modified":
						renderRepeatedTasks();
						break;
					case "removed":
						$(`.task.repeated[data-task-id="${change.doc.id}"]`).remove();
						break;
				}
				checkTasksLength();
			});
		});
}

//todo stop tasks repeating behind the root-repeated date
function renderRepeatedTasks() {
	db.collection(`users/${auth.currentUser.uid}/repeats`)
		.get()
		.then(function (querySnapshot) {
			$(".task.repeated").remove();
			querySnapshot.forEach(function (doc) {
				if (doc.data().repeats.length == 0) {
					db.collection(`users/${auth.currentUser.uid}/weeks/${doc.data().origin.week}/${doc.data().origin.day}`)
						.doc(doc.id)
						.set(doc.data(), { merge: true })
						.then(function () {
							db.collection(`users/${auth.currentUser.uid}/repeats`).doc(doc.id).delete();
							db.collection(`users/${auth.currentUser.uid}/weeks/${doc.data().origin.week}/${doc.data().origin.day}`)
								.doc(doc.id)
								.update({ removedArray: firebase.firestore.FieldValue.delete(), completedArray: firebase.firestore.FieldValue.delete() });
						});
				} else {
					db.collection(`users/${auth.currentUser.uid}/weeks/${doc.data().origin.week}/${doc.data().origin.day}`).doc(doc.id).delete();
					for (i = 0; i < doc.data().repeats.length; i++) {
						let task = `
							<div class="repeated ${doc.data().completedArray.includes($(".day").eq(doc.data().repeats[i]).attr("data-day-id")) ? "task completed" : "task"}" data-task-id="${doc.id}">
								<div class="task__text">
									<img src="assets/img/repeat.svg" title="This is a repeated task!">
									<span>${doc.data().title}</span>
								</div>
								<div class="task__time">${doc.data().time}</div>
							</div>
						`;
						if (
							$(".day").eq(doc.data().repeats[i]).attr("data-day-id") !== doc.data().origin.day &&
							!doc.data().removedArray.includes($(".day").eq(doc.data().repeats[i]).attr("data-day-id"))
						) {
							$(".day").eq(doc.data().repeats[i]).find(".day__tasks-wrapper").prepend(task);
						}
					}
					let rootRepeatedTask = `
						<div class="root-repeated repeated ${doc.data().completedArray.includes(doc.data().origin.day) ? "task completed" : "task"}" data-task-id="${doc.id}">
							<div class="task__text">
								<span>${doc.data().title}</span>
							</div>
							<div class="task__time">${doc.data().time}</div>
						</div>
					`;

					if ($(`.day[data-day-id="${doc.data().origin.day}"]`).length) {
						$(`.day[data-day-id="${doc.data().origin.day}"]`).find(".day__tasks-wrapper").prepend(rootRepeatedTask);
					}
				}
				checkTasksLength();
			});
		});
}

function getReminders() {
	remindersArray = [];
	let currentWeek = moment().format("WW-YYYY");
	db.collection(`users/${auth.currentUser.uid}/weeks/${currentWeek}/${today}`)
		.where("reminder", "==", true)
		.get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				if (clockTime.text() < doc.data().time && doc.data().completed == false) {
					remindersArray.push([doc.data().time, doc.data().title]);
				}
			});
		});
	db.collection(`users/${auth.currentUser.uid}/repeats`)
		.where("reminder", "==", true)
		.get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				if (
					clockTime.text() < doc.data().time &&
					!doc.data().completedArray.includes($(".day").eq(todayIndex).attr("data-day-id")) &&
					!doc.data().removedArray.includes($(".day").eq(todayIndex).attr("data-day-id")) &&
					(doc.data().repeats.includes(todayIndex) || doc.data().origin.day === $(".day").eq(todayIndex).attr("data-day-id"))
				) {
					remindersArray.push([doc.data().time, doc.data().title]);
				}
			});
		});
}

function checkReminders() {
	for (i = 0; i < remindersArray.length; i++) {
		if (moment().format("HH:mm") == remindersArray[i][0]) {
			if (!$(".overlay").hasClass("hidden")) {
				toggleOverlay("off");
			}
			isReminding = true;
			if (!$(".overlay .reminder").length) {
				overlay.append(reminderDialog);
				$("#reminder-notification")[0].play();
			}
			$(".reminder .card__title").text(`Reminder for ${remindersArray[i][0]}`);
			$(".reminder.card").append(`<span class="reminder__task">${remindersArray[i][1]}</span>`);
			if (i === remindersArray.length - 1) {
				toggleOverlay("on");
			}
		}
	}
}

$(document).on("click", "#close-reminder-dialog", function () {
	toggleOverlay("off");
	isReminding = false;
	getReminders();
	$("#reminder-notification")[0].pause();
	$("#reminder-notification")[0].currentTime = 0;
});

//TODO: write a reusable function for all the #close dialog buttons or add a class
//todo: something crazy about the watermarks is fucking happening

calendarControls.click(function () {
	switch ($(this).attr("id")) {
		case "next":
			week++;
			setCurrentDate();
			generateWeek((currentMonday += 7));
			break;
		case "prev":
			week--;
			setCurrentDate();
			generateWeek((currentMonday -= 7));
			break;
		case "settings":
			toggleOverlay("on");
			overlay.append(settingsDialog);
			loadSettings();
			break;
		default:
			week = moment().isoWeek();
			currentMonday = 1;
			setCurrentDate();
			generateWeek(currentMonday);
			break;
	}
	checkIfCurrentWeek();
});

$(window).scroll(function () {
	let windowTop = document.querySelector(".clock").getBoundingClientRect().top + window.scrollY;
	if (windowTop > 30) {
		$(".clock").addClass("clock--sticky");
	} else {
		$(".clock").removeClass("clock--sticky");
	}
});

//* settings
$(document).on("click", ".settings__option", function () {
	$(this).addClass("active");
	$(this).siblings().removeClass("active");
	let selectedOption = $(this).text().toLowerCase();
	$(".settings__section").addClass("hidden");
	$(`.settings__section[data-option="${selectedOption}"]`).removeClass("hidden");
});

$(document).on("click", ".button--setting", function () {
	let settingsRef = db.collection("users").doc(auth.currentUser.uid);
	let selectedOption = $(this).attr("data-option");
	$(this).siblings().addClass("button--off");
	$(this).removeClass("button--off");
	switch ($(this).parent(".settings__group").attr("data-setting")) {
		case "name":
			userObject.settings.name = selectedOption;
			settingsRef.set(
				{
					settings: {
						name: selectedOption,
					},
				},
				{ merge: true }
			);
			break;
		case "theme":
			userObject.settings.theme = selectedOption;
			settingsRef.set(
				{
					settings: {
						theme: selectedOption,
					},
				},
				{ merge: true }
			);
			break;
		case "showSomeday":
			userObject.settings.showSomeday = selectedOption;
			settingsRef.set(
				{
					settings: {
						showSomeday: selectedOption,
					},
				},
				{ merge: true }
			);
			break;
	}
	applySettings();
});

$("body").on("click", "#delete-user-account", function () {
	db.collection("users").doc(auth.currentUser.uid).set({
		isRemoved: true,
	});
	auth.signInWithPopup(googleProvider).then(function (user) {
		let credential = user.credential;
		auth.currentUser.reauthenticateWithCredential(credential).then(() => {
			auth.currentUser.delete().then(() => {
				$("body").css("display", "none");
				location.reload();
			});
		});
	});
});
