import API from "./api/index.js";
import AddButtonComponent from "./components/add-button.js";
import CostComponent from "./components/cost.js";
import FilterController from "./controllers/filter-controller.js";
import InfoSectionComponent from "./components/info-section.js";
import InfoComponent from "./components/info.js";
import MenuComponent from "./components/menu.js";
import PointsModel from "./models/points.js";
import Provider from "./api/provider.js";
import StatisticsComponent from "./components/statistics.js";
import Store from "./api/store.js";
import TripController from "./controllers/trip-controller.js";
import {MenuItem, OffersByType, DestinationsInformation} from "./const.js";
import {render, RenderPosition} from "./utils/render.js";

const END_POINT = `https://11.ecmascript.pages.academy/big-trip`;
const AUTHORIZATION = `Basic hljokjhk1PQsmnmdaHIo=`;
const StorePrefix = {
  EVENTS: `bigtrip-events-localstorage`,
  DESTINATIONS: `bigtrip-destinations-localstorage`,
  OFFERS: `bigtrip-offers-localstorage`
};
const StoreVersion = {
  EVENTS: `v1`,
  DESTINATIONS: `v1`,
  OFFERS: `v1`
};
const EVENTS_STORE_NAME = `${StorePrefix.EVENTS}-${StoreVersion.EVENTS}`;
const DESTINATIONS_STORE_NAME = `${StorePrefix.DESTINATIONS}-${StoreVersion.DESTINATIONS}`;
const OFFERS_STORE_NAME = `${StorePrefix.OFFERS}-${StoreVersion.OFFERS}`;

const api = new API(END_POINT, AUTHORIZATION);
const eventsStore = new Store(EVENTS_STORE_NAME, window.localStorage);
const destinationsStore = new Store(DESTINATIONS_STORE_NAME, window.localStorage);
const offersStore = new Store(OFFERS_STORE_NAME, window.localStorage);
const apiWithProvider = new Provider(api, eventsStore, destinationsStore, offersStore);

const tripMainElement = document.querySelector(`.trip-main`);
const tripControlsElement = tripMainElement.querySelector(`.trip-controls`);
const tripControlsFilterHeaderElement = tripControlsElement.querySelector(`h2:nth-of-type(2)`);

const pointsModel = new PointsModel();

const menuComponent = new MenuComponent();
render(tripControlsFilterHeaderElement, menuComponent, RenderPosition.BEFORE);
menuComponent.setActiveItem(MenuItem.TABLE);

const filterController = new FilterController(tripControlsElement, pointsModel);
filterController.render();

render(tripControlsElement, new InfoSectionComponent(), RenderPosition.BEFORE);

const addButtonComponent = new AddButtonComponent();
render(tripMainElement, addButtonComponent, RenderPosition.BEFOREEND);
addButtonComponent.disableElement();

const tripMainInfoSectionElement = tripMainElement.querySelector(`.trip-info`);
render(tripMainInfoSectionElement, new InfoComponent(), RenderPosition.BEFOREEND);
render(tripMainInfoSectionElement, new CostComponent(), RenderPosition.BEFOREEND);

// Trip
const tripEventsElement = document.querySelector(`.trip-events`);
const tripController = new TripController(tripEventsElement, pointsModel, apiWithProvider);
tripController.render();

tripController.setNewEventFormToggleHandler((isOpen) => {
  if (isOpen) {
    addButtonComponent.disableElement();
  } else {
    addButtonComponent.enableElement();
  }
});

const statisticsComponent = new StatisticsComponent(pointsModel);
render(tripEventsElement, statisticsComponent, RenderPosition.AFTER);
statisticsComponent.hide();

menuComponent.setOnChange((menuItem) => {
  switch (menuItem) {
    case MenuItem.TABLE:
      menuComponent.setActiveItem(MenuItem.TABLE);
      statisticsComponent.hide();
      tripController.show();
      break;
    case MenuItem.STATS:
      menuComponent.setActiveItem(MenuItem.STATS);
      tripController.hide();
      statisticsComponent.show();
      break;
  }
});

addButtonComponent.setOnClick(() => {
  statisticsComponent.hide();
  filterController.reset();
  tripController.show();
  tripController.createEvent();
  menuComponent.setActiveItem(MenuItem.TABLE);
});

Promise
  .all([
    apiWithProvider.getOffers(),
    apiWithProvider.getDestinations(),
    apiWithProvider.getEvents()
  ])
  .then(([offers, destinations, events]) => {
    OffersByType.offers = offers;
    DestinationsInformation.destinations = destinations;
    pointsModel.setEvents(events);
    tripController.setNoLoading();
    addButtonComponent.enableElement();
  })
  .catch(() => {
    tripController.setNoLoading();
    addButtonComponent.enableElement();
  });

window.addEventListener(`online`, () => {
  document.title = document.title.replace(` [offline]`, ``);

  apiWithProvider.sync();
});

window.addEventListener(`offline`, () => {
  document.title += ` [offline]`;
});
