/* Copyright(C) 2017-2024, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * server.js: homebridge-unifi-protect webUI server API.
 *
 * This module is heavily inspired by the homebridge-config-ui-x source code and borrows from both.
 * Thank you oznu for your contributions to the HomeKit world.
 */
"use strict";

import { featureOptionCategories, featureOptions } from "../dist/protect-options.js";
import { HomebridgePluginUiServer } from "@homebridge/plugin-ui-utils";
import { ProtectApi } from "unifi-protect";
import util from "node:util";

class PluginUiServer extends HomebridgePluginUiServer {

  errorInfo;

  constructor() {

    super();

    this.errorInfo = "";

    // Register getErrorMessage() with the Homebridge server API.
    this.#registerGetErrorMessage();

    // Register getDevices() with the Homebridge server API.
    this.#registerGetDevices();

    // Register getOptions() with the Homebridge server API.
    this.#registerGetOptions();

    this.ready();
  }

  // Register the getErrorMessage() webUI server API endpoint.
  #registerGetErrorMessage() {

    // Return the most recent error message generated by the Protect API.
    this.onRequest("/getErrorMessage", () => this.errorInfo);
  }

  // Register the getDevices() webUI server API endpoint.
  #registerGetDevices() {

    // Return the list of Protect devices.
    this.onRequest("/getDevices", async (controller) => {

      try {

        const log = {

          debug: () => {},
          error: (message, parameters = []) => {

            // Save the error to inform the user in the webUI.
            this.errorInfo = util.format(message, ...(Array.isArray(parameters) ? parameters : [parameters]));

            // eslint-disable-next-line no-console
            console.error(this.errorInfo);
          },
          info: () => {},
          warn: () => {}
        };

        // Connect to the Protect controller.
        const ufpApi = new ProtectApi(log);

        if(!(await ufpApi.login(controller.address, controller.username, controller.password))) {

          return [];
        }

        // Bootstrap the controller. It will emit a message once it's received the bootstrap JSON, or you can alternatively wait for the Promise to resolve.
        if(!(await ufpApi.getBootstrap())) {

          return [];
        }

        const bootstrap = ufpApi.bootstrap;

        bootstrap.cameras = bootstrap.cameras.filter(x => !x.isAdoptedByOther && x.isAdopted);
        bootstrap.chimes = bootstrap.chimes.filter(x => !x.isAdoptedByOther && x.isAdopted);
        bootstrap.lights = bootstrap.lights.filter(x => !x.isAdoptedByOther && x.isAdopted);
        bootstrap.sensors = bootstrap.sensors.filter(x => !x.isAdoptedByOther && x.isAdopted);
        bootstrap.viewers = bootstrap.viewers.filter(x => !x.isAdoptedByOther && x.isAdopted);

        bootstrap.cameras.sort((a, b) => {

          const aCase = (a.name ?? a.marketName).toLowerCase();
          const bCase = (b.name ?? b.marketName).toLowerCase();

          return aCase > bCase ? 1 : (bCase > aCase ? -1 : 0);
        });

        bootstrap.chimes.sort((a, b) => {

          const aCase = (a.name ?? a.marketName).toLowerCase();
          const bCase = (b.name ?? b.marketName).toLowerCase();

          return aCase > bCase ? 1 : (bCase > aCase ? -1 : 0);
        });

        bootstrap.lights.sort((a, b) => {

          const aCase = (a.name ?? a.marketName).toLowerCase();
          const bCase = (b.name ?? b.marketName).toLowerCase();

          return aCase > bCase ? 1 : (bCase > aCase ? -1 : 0);
        });

        bootstrap.sensors.sort((a, b) => {

          const aCase = (a.name ?? a.marketName).toLowerCase();
          const bCase = (b.name ?? b.marketName).toLowerCase();

          return aCase > bCase ? 1 : (bCase > aCase ? -1 : 0);
        });

        bootstrap.viewers.sort((a, b) => {

          const aCase = (a.name ?? a.marketName).toLowerCase();
          const bCase = (b.name ?? b.marketName).toLowerCase();

          return aCase > bCase ? 1 : (bCase > aCase ? -1 : 0);
        });

        return [ ufpApi.bootstrap.nvr, ...ufpApi.bootstrap.cameras, ...ufpApi.bootstrap.chimes, ...ufpApi.bootstrap.lights, ...ufpApi.bootstrap.sensors,
          ...ufpApi.bootstrap.viewers ];
      } catch(err) {

        // eslint-disable-next-line no-console
        console.log(err);

        // Return nothing if we error out for some reason.
        return [];
      }
    });
  }

  // Register the getOptions() webUI server API endpoint.
  #registerGetOptions() {

    // Return the list of options configured for a given Protect device.
    this.onRequest("/getOptions", () => ({ categories: featureOptionCategories, options: featureOptions }));
  }
}

(() => new PluginUiServer())();
