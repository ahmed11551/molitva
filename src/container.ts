import { loadConfig } from "./config";
import { PrayerDebtRepository } from "./repositories/prayerDebtRepository";
import { EReplikaClient } from "./services/eReplikaClient";
import { PrayerDebtService } from "./services/prayerDebtService";
import { PrayerDebtController } from "./controllers/prayerDebtController";
import { WebhookController } from "./controllers/webhookController";
import { DuaService } from "./services/duaService";
import { DuaController } from "./controllers/duaController";
import { AIService } from "./services/aiService";
import { AIController } from "./controllers/aiController";
import { GoalService } from "./services/goalService";
import { GoalController } from "./controllers/goalController";
import { GlossaryService } from "./services/glossaryService";
import { GlossaryController } from "./controllers/glossaryController";
import { PrayerCalendarService } from "./services/prayerCalendarService";
import { PrayerCalendarController } from "./controllers/prayerCalendarController";
import { FriendsService } from "./services/friendsService";
import { FriendsController } from "./controllers/friendsController";

const config = loadConfig();
const repository = new PrayerDebtRepository();
const eReplikaClient = new EReplikaClient(config.eReplika);
const prayerDebtService = new PrayerDebtService(
  repository,
  config,
  eReplikaClient
);
const duaService = new DuaService(eReplikaClient);
const goalService = new GoalService();
const glossaryService = new GlossaryService(eReplikaClient);
const prayerCalendarService = new PrayerCalendarService();
const friendsService = new FriendsService();

export const prayerDebtController = new PrayerDebtController(
  prayerDebtService
);
export const webhookController = new WebhookController(prayerDebtService, eReplikaClient);
export const duaController = new DuaController(duaService);

const aiService = new AIService();
export const aiController = new AIController(aiService, prayerDebtService);

export const goalController = new GoalController(goalService, prayerDebtService);
export const glossaryController = new GlossaryController(glossaryService);
export const prayerCalendarController = new PrayerCalendarController(
  prayerCalendarService,
  prayerDebtService
);
export const friendsController = new FriendsController(friendsService);


