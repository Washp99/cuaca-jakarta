import axios, { type AxiosResponse } from 'axios';

export default class EndPointAccess {
  theUrl: string;

  constructor(url: string) {
    this.theUrl = url;
  }

  async getRes<T>(): Promise<AxiosResponse<T>> {
    return axios.get<T>(this.theUrl);
  }
}
