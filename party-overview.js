import { currentSystemProvider, initApi } from "./module/api.js";
import PartyOverviewApp from "./module/logic.js";
import { registerSettings, registerApiSettings } from "./module/settings.js";

Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
	return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

let partyOverview;

Hooks.once("init", () => {
	registerSettings();
	initApi();
	registerApiSettings();
	partyOverview = new PartyOverviewApp();

	return loadTemplates([
		"modules/party-overview/templates/parts/Tabs.html",
		"modules/party-overview/templates/parts/FilterButton.html",
		"modules/party-overview/templates/parts/Languages.html",
		...currentSystemProvider.loadTemplates,
	]);
});

Hooks.on("ready", () => {
	if (partyOverview) partyOverview.update();
	else partyOverview = new PartyOverviewApp();
});

Hooks.on("renderActorDirectory", (app, html, data) => {
	if (!game.user.isGM && !game.settings.get("party-overview", "EnablePlayerAccess")) return;

	let button = $(`<button class="party-overview ${currentSystemProvider.customCSS}"><i class="fas fa-users"></i> Party Overview</button>`);
	button.on("click", (e) => {
		partyOverview.render(true);
	});

	$(html).find(".header-actions").prepend(button);
});

Hooks.on("deleteActor", (actor, ...rest) => {
	if (actor.hasPlayerOwner) {
		partyOverview.update();
		partyOverview.render(false);
	}
});

Hooks.on("updateActor", (actor, ...rest) => {
	if (actor.hasPlayerOwner) {
		partyOverview.update();
		partyOverview.render(false);
	}
});

Hooks.on("createToken", (scene, sceneId, token, ...rest) => {
	let actor = game.actors.contents.find((actor) => actor.id === token.actorId);
	if (actor && actor.hasPlayerOwner) {
		partyOverview.update();
		partyOverview.render(false);
	}
});

Hooks.on("deleteToken", (...rest) => {
	partyOverview.update();
	partyOverview.render(false);
});

Hooks.on("updateScene", (scene, changes, ...rest) => {
	if (changes.active) {
		// what a hack! the hook is fired when the scene switch is not yet activated, so we need
		// to wait a tiny bit. The combat tracker is rendered last, so the scene should be available
		Hooks.once("renderCombatTracker", (...rest) => {
			partyOverview.update();
			partyOverview.render(false);
		});
	}
});
