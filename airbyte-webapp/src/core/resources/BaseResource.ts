import {
  Method,
  MutateShape,
  Resource,
  AbstractInstanceType,
  ReadShape,
  schemas,
  SchemaDetail,
  SchemaList,
} from "rest-hooks";

import { NetworkError } from "core/request/NetworkError";
import { AirbyteRequestService } from "../request/AirbyteRequestService";

// TODO: rename to crud resource after upgrade to rest-hook 5.0.0
export default abstract class BaseResource extends Resource {
  /** Perform network request and resolve with HTTP Response */
  static async fetchResponse(
    _: Method,
    url: string,
    body?: Readonly<Record<string, unknown> | Array<unknown> | string>
  ): Promise<Response> {
    let options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (this.fetchOptionsPlugin) options = this.fetchOptionsPlugin(options);
    if (body) options.body = JSON.stringify(body);

    return fetch(url, options);
  }

  /** Perform network request and resolve with json body */
  static async fetch<T extends unknown>(
    method: Method,
    url: string,
    body?: Readonly<Record<string, unknown> | Array<unknown> | string>
  ): Promise<T> {
    const response = await this.fetchResponse(method, url, body);

    if (response.status >= 200 && response.status < 300) {
      return response.status === 204 ? {} : await response.json();
    } else {
      const e = new NetworkError(response);
      e.status = response.status;
      throw e;
    }
  }

  static listUrl<T extends typeof Resource>(this: T): string {
    return `${AirbyteRequestService.rootUrl}${this.urlRoot}`;
  }

  static url<T extends typeof Resource>(
    this: T,
    _: Readonly<Record<string, unknown>>
  ): string {
    return `${AirbyteRequestService.rootUrl}${this.urlRoot}`;
  }

  static rootUrl(): string {
    return AirbyteRequestService.rootUrl;
  }

  static listShape<T extends typeof Resource>(
    this: T
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    return {
      ...super.listShape(),
      getFetchKey: (params: Readonly<Record<string, unknown>>) =>
        "POST " + this.url(params) + "/list" + JSON.stringify(params),
      fetch: async (
        params: Readonly<Record<string, string | number>>
      ): Promise<unknown> => {
        const response = await this.fetch(
          "post",
          `${this.listUrl(params)}/list`,
          { ...params }
        );
        return response;
      },
    };
  }

  static detailShape<T extends typeof Resource>(
    this: T
  ): ReadShape<SchemaDetail<AbstractInstanceType<T>>> {
    return {
      ...super.detailShape(),
      getFetchKey: (params: Readonly<Record<string, unknown>>) =>
        "POST " + this.url(params) + "/get" + JSON.stringify(params),
      fetch: async (
        params: Readonly<Record<string, string | number>>
      ): Promise<unknown> => {
        const response = await this.fetch(
          "post",
          `${this.url(params)}/get`,
          params
        );
        return response;
      },
    };
  }

  static createShape<T extends typeof Resource>(
    this: T
  ): MutateShape<SchemaDetail<AbstractInstanceType<T>>> {
    return {
      ...super.createShape(),
      getFetchKey: (params: Readonly<Record<string, unknown>>) =>
        "POST " + this.url(params) + "/create" + JSON.stringify(params),
      fetch: async (
        params: Readonly<Record<string, string | number>>,
        body: Readonly<Record<string, unknown>>
      ): Promise<unknown> => {
        const response = await this.fetch(
          "post",
          `${this.listUrl(params)}/create`,
          body
        );
        return response;
      },
    };
  }

  static deleteShape<T extends typeof Resource>(
    this: T
  ): MutateShape<
    schemas.Delete<T>,
    Readonly<Record<string, unknown>>,
    unknown
  > {
    return {
      ...super.deleteShape(),
      getFetchKey: (params: Readonly<Record<string, unknown>>) =>
        "POST " + this.url(params) + "/delete" + JSON.stringify(params),
      fetch: async (
        params: Readonly<Record<string, string | number>>
      ): Promise<unknown> => {
        const response = await this.fetch(
          "post",
          `${this.url(params)}/delete`,
          params
        );
        return response;
      },
    };
  }

  static partialUpdateShape<T extends typeof Resource>(
    this: T
  ): MutateShape<SchemaDetail<AbstractInstanceType<T>>> {
    return {
      ...super.partialUpdateShape(),
      getFetchKey: (params: Readonly<Record<string, unknown>>) =>
        "POST " + this.url(params) + "/partial-update" + JSON.stringify(params),
      fetch: async (
        params: Readonly<Record<string, string | number>>,
        body: Readonly<Record<string, unknown>>
      ): Promise<unknown> => {
        const response = await this.fetch(
          "post",
          `${this.url(params)}/update`,
          body
        );
        return response;
      },
    };
  }
}
