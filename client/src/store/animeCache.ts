import axios from '@/plugins/axios';
import {Series} from '@/types';
import {AxiosResponse} from 'axios';
import _, {Dictionary} from 'lodash';

class AnimeCache {
  private cache: Dictionary<Series> = {};

  getSeries(id: number) {
    if (!this.cache[id]) {
      this.cache[id] = {} as Series;
      // this.fetch();
    }
    return this.cache[id];
  }

  private add(series: Series) {
    if (this.cache[series.id]) {
      Object.assign(this.cache[series.id], series);
    } else {
      this.cache[series.id] = series;
    }
  }

  getList() {
    return Object.values(this.cache);
  }

  fetch() {
    const ids = Object.keys(_.pickBy(this.cache, (value: Series) => !value.id));
    if (ids.length > 0) {
      return axios
        .get('/api/series/get', {
          params: {ids},
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          useCache: true
        })
        .then((response: AxiosResponse) => {
          for (const series of response.data) {
            this.add(series);
          }
          return this.getList();
        });
    } else {
      return new Promise<Series[]>(resolve => resolve(this.getList()));
    }
  }

  search(search: string) {
    return axios
      .get('/api/series/search/' + encodeURIComponent(search))
      .then((response: { data: { media: Series[] } }) => {
        for (const series of response.data.media) {
          this.add(series);
        }
        return this.getList();
      })
      .catch((error: object) => {
        console.log(error);
      });
  }
}

const cache = new AnimeCache();

export default cache;

