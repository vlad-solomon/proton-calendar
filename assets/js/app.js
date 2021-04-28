const clockGreeting = $(".clock__greeting");
const clockTime = $(".clock__time");
const clockDate = $(".clock__date");
const calendarControls = $(".calendar-controls .button");
const overlay = $(".overlay");

let weeks = store.get("weeks") == undefined ? { user: "userName", repeatedTasks: [], someday: [] } : store.get("weeks");

function localSave() {
	store.set("weeks", weeks);
}

localSave();

let isReminding = false;
let todayIndex;
let today = moment().format("DD-MM-YYYY");
let week = moment().isoWeek();
let currentMonday = 1;
let remindersArray = [];
let remainingMinute = (60 - moment().seconds()) * 1000;
let hour = moment().hour();

setGreeting();
setCurrentTime();
setCurrentDate();
generateWeek(currentMonday);
getReminders();

setInterval(function () {
	setCurrentTime();
}, 1000);

setTimeout(function () {
	checkReminders();
	setGreeting();
	setInterval(function () {
		checkReminders();
		setGreeting();
	}, 60000);
}, remainingMinute);

function setGreeting() {
	let userName = store.get("weeks").user;

	if (hour >= 5 && hour < 12) {
		clockGreeting.text(`Good morning, ${userName}!`);
	} else if (hour >= 12 && hour < 17) {
		clockGreeting.text(`Good afternoon, ${userName}!`);
	} else {
		clockGreeting.text(`Good evening, ${userName}!`);
	}
}

function setCurrentTime() {
	let currentTime = moment().format("HH:mm:ss");
	clockTime.text(currentTime);

	document.title = isReminding ? "You've got a reminder!" : `Proton ∣ ${currentTime}`;
	checkIfMidnight();
}

function checkReminders() {
	for (i = 0; i < remindersArray.length; i++) {
		if (moment().format("HH:mm") == remindersArray[i][0]) {
			toggleOverlay("off");
			isReminding = true;
			toggleOverlay("on");
			if (!$(".overlay .reminder").length) {
				overlay.append(reminderDialog);
				$("#reminder-notification")[0].play();
			}
			$(".reminder .card__title").text(`Reminder for ${remindersArray[i][0]}`);
			$(".reminder").append(`<span class="reminder__task">${remindersArray[i][1]}</span>`);
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

function setCurrentDate() {
	let currentDate = moment().isoWeek(week).format("[Week] W, YYYY");
	$(".week").attr("data-week-id", moment().isoWeek(week).format("W-YYYY"));
	clockDate.text(currentDate);
}

function checkRepeats() {
	for (i = 0; i < weeks.repeatedTasks.length; i++) {
		for (j = 0; j < weeks.repeatedTasks[i].repeats.length; j++) {
			let repeatedTaskTime = weeks.repeatedTasks[i].time;
			repeatedTaskTime = repeatedTaskTime != "" ? repeatedTaskTime : "";

			const repeatedTask = $("<div>");
			repeatedTask.addClass("task repeated");
			repeatedTask.attr("data-origin-week", weeks.repeatedTasks[i].originWeek);
			repeatedTask.attr("data-origin-day", weeks.repeatedTasks[i].originDay);
			repeatedTask.attr("data-origin-id", weeks.repeatedTasks[i].uuid);
			repeatedTask.append(
				`<div class="task__text"><img src="assets/img/repeat.svg" title="This is a repeated task!"><span>${weeks.repeatedTasks[i].title}</span></div><div class="task__time">${repeatedTaskTime}</div>`
			);

			// ? stop tasks from repeating behind the day they were created with an && day id > repeatedTask.attr(data-origin-day)
			if ($(".week").attr("data-week-id") >= repeatedTask.attr("data-origin-week")) {
				if ($(".day").eq(weeks.repeatedTasks[i].repeats[j]).attr("data-day-id") != repeatedTask.attr("data-origin-day")) {
					$(".day").eq(weeks.repeatedTasks[i].repeats[j]).find(".day__tasks-wrapper").append(repeatedTask);
				}
			}
		}
	}
}

function generateWeek(monday) {
	let weekId = $(".week").attr("data-week-id");
	$(".week").children().remove();
	for (let i = 0; i < 7; i++) {
		let dayDate = moment()
			.isoWeekday(i + monday)
			.format("dddd, DD.MM");
		let dayId = moment()
			.isoWeekday(i + monday)
			.format("DD-MM-YYYY");

		const day = `
			<div class="day" data-day-id="${dayId}">
				<div class="day__head">
					<span class="day__date">${dayDate}</span>
					<div class="day__badges"></div>
				</div>
				<div class="day__body">
					<div class="day__tasks-wrapper"></div>
				</div>
			</div>`;

		$(".week").append(day);
	}

	const someday = `
		<div class="day someday" data-day-id="someday">
			<div class="day__head">
				<span class="day__date">Someday</span>
				<div class="day__badges"></div>
			</div>
			<div class="day__body">
				<div class="day__tasks-wrapper"></div>
			</div>
		</div>`;

	$(".week").append(someday);

	if (weeks.hasOwnProperty(weekId)) {
		checkTasks();
	}

	checkSomedayTasks();
	checkRepeats();
	checkToday();

	for (i = 0; i < weeks.repeatedTasks.length; i++) {
		for (j = 0; j < weeks.repeatedTasks[i].deletedArray.length; j++) {
			$(`.day[data-day-id="${weeks.repeatedTasks[i].deletedArray[j]}"]`).find(`.task[data-origin-id="${weeks.repeatedTasks[i].uuid}"]`).remove();
		}
		for (k = 0; k < weeks.repeatedTasks[i].completedArray.length; k++) {
			$(`.day[data-day-id="${weeks.repeatedTasks[i].completedArray[k]}"]`).find(`.task[data-origin-id="${weeks.repeatedTasks[i].uuid}"]`).addClass("completed");
		}
	}
	checkTasksLength();
}

function checkToday() {
	if (!$(`.day[data-day-id="${today}"]`).find(".day__badges").children(".day__today").length) {
		$(`.day[data-day-id="${today}"]`).find(".day__badges").prepend(`<span class="day__today" data-html2canvas-ignore>Today</span>`);
	}
	todayIndex = $(".day__today").parents().eq(2).index();
}

function checkIfMidnight() {
	if (clockTime.text() == "00:00:00") {
		today = moment().format("DD-MM-YYYY");
		todayIndex = $(".day__today").parents().eq(2).index();
		week = moment().isoWeek();
		setCurrentDate();
		generateWeek(currentMonday);
		getReminders();
		checkIfCurrentWeek();
	}
}

function checkTasksLength() {
	$(".day").each(function () {
		let totalTasks = $(this).find(".task").length - $(this).find(".task.completed").length;
		if (totalTasks > 0) {
			$(this).find(".day__badges").find(".day__task").text(totalTasks);
			if ($(this).find(".day__badges").find(".day__task").length == 0) {
				$(this).find(".day__badges").append(`<span class="day__task">${totalTasks}</span>`);
			}
		}
	});
}

function checkIfCurrentWeek() {
	if ($(".day__today").length) {
		$("#today").addClass("hidden");
	} else {
		$("#today").removeClass("hidden");
	}
}

function getReminders() {
	let todayWeek = $(".week").attr("data-week-id");
	remindersArray = [];
	if (weeks.hasOwnProperty(todayWeek)) {
		if (weeks[todayWeek].hasOwnProperty(today)) {
			for (let i = 0; i < weeks[todayWeek][today].length; i++) {
				if (weeks[todayWeek][today][i].reminder == true && weeks[todayWeek][today][i].completed == false && weeks[todayWeek][today][i].time > clockTime.text()) {
					remindersArray.push([weeks[todayWeek][today][i].time, weeks[todayWeek][today][i].title]);
				}
			}
		}
	}
	if (weeks.repeatedTasks.length > 0) {
		for (j = 0; j < weeks.repeatedTasks.length; j++) {
			if (weeks.repeatedTasks[j].repeats.includes(todayIndex) && weeks.repeatedTasks[j].time > clockTime.text()) {
				remindersArray.push([weeks.repeatedTasks[j].time, weeks.repeatedTasks[j].title]);
			}
		}
	}
}

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
		case "share":
			toggleOverlay("on");
			$(".day").css({
				"box-shadow": "unset",
				border: "2px solid #f2f2f2",
			});
			$(".day").last().addClass("hidden");
			$(".week").css("padding", "10px");
			overlay.append(shareDialog);
			captureWeek();
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

let image;

function captureWeek() {
	$("canvas").remove();
	html2canvas(document.querySelector(".week"), {
		scale: 1,
	}).then((canvas) => {
		document.querySelector(".share__calendar").appendChild(canvas);
		image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
		$("#download").removeClass("hidden");
		$(".share__options .button").removeAttr("style");
		if ($(".share__options").find(".button:not('.button--off')").length == 1) {
			$(".share__options").find(".button:not('.button--off')").css("pointer-events", "none");
		}
	});
}

$(document).on("click", "#download", function () {
	let sharedWeek = $(".week").attr("data-week-id");
	let link = document.createElement("a");
	if (typeof link.download === "string") {
		link.href = image;
		link.download = `proton-${sharedWeek}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	} else {
		window.open(image);
	}
});

$(document).on("click", ".share__options .button", function () {
	$("#download").addClass("hidden");
	let dayIndex = $(this).index();
	$(this).toggleClass("button--off");
	$(".share__options .button").css("pointer-events", "none");
	if ($(this).hasClass("button--off")) {
		$(".day").eq(dayIndex).addClass("hidden");
	} else {
		$(".day").eq(dayIndex).removeClass("hidden");
	}

	captureWeek();
});

$(document).on("click", "#cancel-share", function () {
	toggleOverlay("off");
	$(".day , .week").removeAttr("style");
	$(".day").removeClass("hidden");
});

$(document).on("mouseenter", ".day", function () {
	if (!$(".add-task").length) {
		$(this).find(".day__badges").prepend(`<span class="day__weather">Check weather</span>`);
		$(this).find(".day__tasks-wrapper").append(addTaskButton);
	}
});
$(document).on("mouseleave", ".day", function () {
	$(".day__weather").remove();
	$(".add-task").remove();
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

let humazinedDay;
let selectedWeek, selectedDay;

$(document).on("click", ".day__tasks-wrapper > *", function () {
	humazinedDay = $(this).parents().eq(2).find(".day__head .day__date").text();

	toggleOverlay("on");
	overlay.append(createTaskDialog);

	if ($(this).parents().eq(2).hasClass("someday")) {
		$(".create-task").addClass("someday");
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

	$(".overlay__heading").text(humazinedDay);
	$("#task-title").focus();
});

let isEditingTask = false;
let selectedTaskId, selectedTaskObject;

$(document).on("click", ".task", function () {
	isEditingTask = true;
	selectedWeek = $(".week").attr("data-week-id");
	selectedDay = $(this).parents().eq(2).attr("data-day-id");
	selectedTaskId = $(this).attr("data-uuid");

	if ($(this).hasClass("repeated")) {
		let originWeek = $(this).attr("data-origin-week");
		let originDay = $(this).attr("data-origin-day");
		let originId = $(this).attr("data-origin-id");

		selectedTaskObject = weeks[originWeek][originDay].find((task) => task.uuid === originId);
		humazinedDay = `Repeated task`;

		const repeatWarning = `
			<div class="overlay__warning">
				<p>This is a repeated task from ${originDay.replace(/-/g, ".")}.</p>
				<p>All the changes you make to this task will modify the original one.</p>
			</div>
		`;

		$(".overlay__heading").after(repeatWarning);
		$("#accept").addClass("repeated");
	} else if ($(this).hasClass("someday")) {
		selectedTaskObject = weeks.someday.find((task) => task.uuid === selectedTaskId);
	} else {
		selectedTaskObject = weeks[selectedWeek][selectedDay].find((task) => task.uuid === selectedTaskId);
	}

	$(".overlay__heading").text(humazinedDay);
	$("#task-title").val(selectedTaskObject.title);
	$("#task-description").val(selectedTaskObject.description);
	$("#task-time").val(selectedTaskObject.time);

	if (selectedTaskObject.reminder == true) {
		$(".button--reminder").removeClass("button--off").text("ON").attr("data-reminder", "true");
	}
	if (selectedTaskObject.repeats != undefined && selectedTaskObject.repeats.length > 0) {
		$(".week-days").attr("data-repeats", JSON.stringify(selectedTaskObject.repeats));
		repeatDays = JSON.parse($(".week-days").attr("data-repeats"));
		for (i = 0; i < selectedTaskObject.repeats.length; i++) {
			$(".week-days__button").eq(selectedTaskObject.repeats[i]).removeClass("button--off");
		}
	}
	if (selectedTaskObject.time != "") {
		$(".reminder-wrap").removeClass("hidden");
	}

	$("#task-title").css("height", `${$("#task-title")[0].scrollHeight + 1}px`);
	$("#task-description").css("height", `${$("#task-description")[0].scrollHeight + 1}px`);
});

$(document).on("click", ".button--reminder", function () {
	$(this).toggleClass("button--off");
	if ($(this).hasClass("button--off")) {
		$(this).text("OFF").attr("data-reminder", "false");
	} else {
		$(this).text("ON").attr("data-reminder", "true");
	}
});

let repeatDays = [];

$(document).on("click", ".create-task .week-days__button", function () {
	if ($(this).hasClass("button--off")) {
		$(this).removeClass("button--off");
		repeatDays.push($(this).index());
	} else {
		$(this).addClass("button--off");
		repeatDays.splice(
			repeatDays.findIndex((index) => index === $(this).index()),
			1
		);
	}
	repeatDays = repeatDays.sort();
	$(".week-days").attr("data-repeats", JSON.stringify(repeatDays));
});

$(document).on("click", "#accept", function () {
	let uniqueId = uuid.v4();
	let taskObject = {
		uuid: uniqueId,
		title: $("#task-title").val(),
		description: $("#task-description").val(),
		time: $("#task-time").val(),
		completed: false,
		reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
		repeats: JSON.parse($(".week-days").attr("data-repeats")),
		originWeek: selectedWeek,
		originDay: selectedDay,
		deletedArray: [],
		completedArray: [],
	};
	if ($(this).parent().siblings(".create-task").hasClass("someday")) {
		taskObject = {
			uuid: uniqueId,
			title: $("#task-title").val(),
			description: $("#task-description").val(),
			completed: false,
		};
		if (isEditingTask) {
			selectedTaskObject.title = $("#task-title").val();
			selectedTaskObject.description = $("#task-description").val();
			weeks.someday.splice(
				weeks.someday.findIndex((index) => index.uuid === selectedTaskObject.uuid),
				1,
				selectedTaskObject
			);
		} else {
			weeks.someday.push(taskObject);
		}
	} else {
		if (weeks[selectedWeek] == undefined) {
			weeks[selectedWeek] = {};
		}
		if (weeks[selectedWeek][selectedDay] == undefined && !$(this).hasClass("repeated")) {
			weeks[selectedWeek][selectedDay] = [];
		}
		if (isEditingTask) {
			selectedTaskObject.title = $("#task-title").val();
			selectedTaskObject.description = $("#task-description").val();
			selectedTaskObject.time = $("#task-time").val();
			selectedTaskObject.reminder = JSON.parse($(".button--reminder").attr("data-reminder"));
			selectedTaskObject.repeats = JSON.parse($(".week-days").attr("data-repeats"));

			let index = weeks.repeatedTasks.findIndex((index) => index.uuid === selectedTaskObject.uuid);

			if (selectedTaskObject.repeats.length > 0) {
				if (weeks.repeatedTasks.find((task) => task.uuid === selectedTaskObject.uuid) == undefined) {
					weeks.repeatedTasks.push(selectedTaskObject);
				} else {
					weeks.repeatedTasks.splice(index, 1, selectedTaskObject);
				}
			} else {
				weeks.repeatedTasks.splice(index, 1);
			}
			isEditingTask = false;
		} else {
			weeks[selectedWeek][selectedDay].push(taskObject);
			if (taskObject.repeats.length > 0) {
				weeks.repeatedTasks.push(taskObject);
			}
		}
	}

	repeatDays = [];
	generateWeek(currentMonday);
	toggleOverlay("off");
	getReminders();

	localSave();
});

$(document).on("click", "#cancel", function () {
	repeatDays = [];
	toggleOverlay("off");
	isEditingTask = false;
});

$(document).on("keyup keydown click", ".create-task", function () {
	if (!isEditingTask && $("#task-title").val().trim().length > 0) {
		$("#accept").removeClass("hidden");
	} else {
		$("#accept").addClass("hidden");
	}
	if (isEditingTask && $(".create-task").hasClass("someday")) {
		if (selectedTaskObject.title != $("#task-title").val() || selectedTaskObject.description != $("#task-description").val()) {
			$("#accept").removeClass("hidden");
		}
	} else if (isEditingTask && !$(".create-task").hasClass("someday")) {
		if (
			selectedTaskObject.title != $("#task-title").val() ||
			selectedTaskObject.description != $("#task-description").val() ||
			selectedTaskObject.time != $("#task-time").val() ||
			selectedTaskObject.reminder != JSON.parse($(".button--reminder").attr("data-reminder")) ||
			JSON.stringify(selectedTaskObject.repeats) != $(".week-days").attr("data-repeats")
		) {
			$("#accept").removeClass("hidden");
		}
	}
	if ($("#task-title").val().length == 0) {
		$("#accept").addClass("hidden");
	}

	if ($("#task-time").val().length > 0) {
		$(".reminder-wrap").removeClass("hidden");
	} else {
		$(".reminder-wrap").addClass("hidden");
		$(".button--reminder").text("OFF").attr("data-reminder", "false").addClass("button--off");
	}
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

$(document).on("mouseenter", ".task", function () {
	$(this).append(taskBadges);
	$(this).find(".task__time").css("display", "none");
});

$(document).on("mouseleave", ".task", function () {
	$(this).find(".task__badges").remove();
	$(this).find(".task__time").removeAttr("style");
});

$(document).on("click", ".task__badges img", function (event) {
	event.stopPropagation();
	let clickedTaskWeek = $(".week").attr("data-week-id");
	let clickedTaskDay = $(this).parents().eq(4).attr("data-day-id");
	if ($(this).parents().eq(1).hasClass("repeated")) {
		let originId = $(this).parents().eq(1).attr("data-origin-id");
		let index = weeks.repeatedTasks.findIndex((task) => task.uuid === originId);
		switch ($(this).attr("id")) {
			case "complete-task":
				if (!weeks.repeatedTasks[index].completedArray.includes(clickedTaskDay)) {
					weeks.repeatedTasks[index].completedArray.push(clickedTaskDay);
				} else {
					weeks.repeatedTasks[index].completedArray.splice(
						weeks.repeatedTasks[index].completedArray.findIndex((task) => task === clickedTaskDay),
						1
					);
				}
				break;
			case "remove-task":
				weeks.repeatedTasks[index].deletedArray.push(clickedTaskDay);
				break;
		}
	} else if ($(this).parents().eq(1).hasClass("someday")) {
		let clickedTaskId = $(this).parents().eq(1).attr("data-uuid");
		let clickedTaskObject = weeks.someday.find((task) => task.uuid === clickedTaskId);
		let clickedTaskObjectIndex = weeks.someday.findIndex((task) => task.uuid === clickedTaskId);
		switch ($(this).attr("id")) {
			case "complete-task":
				clickedTaskObject.completed = !clickedTaskObject.completed;
				break;
			case "remove-task":
				weeks.someday.splice(clickedTaskObjectIndex, 1);
				break;
		}
	} else {
		let clickedTaskId = $(this).parents().eq(1).attr("data-uuid");
		let clickedTaskObject = weeks[clickedTaskWeek][clickedTaskDay].find((task) => task.uuid === clickedTaskId);
		let clickedTaskObjectIndex = weeks[clickedTaskWeek][clickedTaskDay].findIndex((task) => task.uuid === clickedTaskId);
		switch ($(this).attr("id")) {
			case "complete-task":
				clickedTaskObject.completed = !clickedTaskObject.completed;
				break;
			case "remove-task":
				weeks[clickedTaskWeek][clickedTaskDay].splice(clickedTaskObjectIndex, 1);
				weeks.repeatedTasks.splice(
					weeks.repeatedTasks.findIndex((task) => task.uuid == clickedTaskId),
					1
				);
				if (weeks[clickedTaskWeek][clickedTaskDay].length == 0) {
					delete weeks[clickedTaskWeek][clickedTaskDay];
				}
				break;
		}
	}

	generateWeek(currentMonday);
	getReminders();

	localSave();
});

function checkTasks() {
	let focusedWeek = $(".week").attr("data-week-id");
	let focusedWeekDays = Object.keys(weeks[focusedWeek]);
	for (let i = 0; i < focusedWeekDays.length; i++) {
		for (let j = 0; j < weeks[focusedWeek][focusedWeekDays[i]].length; j++) {
			let taskText = weeks[focusedWeek][focusedWeekDays[i]][j].title;
			let taskTime = weeks[focusedWeek][focusedWeekDays[i]][j].time;
			let uniqueId = weeks[focusedWeek][focusedWeekDays[i]][j].uuid;
			let taskStatus = weeks[focusedWeek][focusedWeekDays[i]][j].completed;

			taskTime = taskTime != "" ? taskTime : "";

			const task = $("<div>");
			task.addClass("task");
			task.attr("data-uuid", uniqueId);
			task.append(`<div class="task__text"><span>${taskText}</span></div><div class="task__time">${taskTime}</div>`);

			if (taskStatus == true) {
				task.addClass("completed");
			}

			$(`.day[data-day-id="${focusedWeekDays[i]}"]`).find(".day__tasks-wrapper").append(task);
		}
	}
}

function checkSomedayTasks() {
	if (weeks.someday.length > 0) {
		for (i = 0; i < weeks.someday.length; i++) {
			let somedayTaskId = weeks.someday[i].uuid;
			let somedayTaskText = weeks.someday[i].title;
			let somedayTaskStatus = weeks.someday[i].completed;

			const somedayTask = $("<div>");
			somedayTask.addClass("task someday");
			somedayTask.attr("data-uuid", somedayTaskId);
			somedayTask.append(`<div class="task__text"><span>${somedayTaskText}</span></div>`);

			if (somedayTaskStatus == true) {
				somedayTask.addClass("completed");
			}

			$(".someday").find(".day__tasks-wrapper").append(somedayTask);
		}
	}
}
