import Jimp from 'jimp';
import TurndownService from 'turndown';

export class DiscordHelper {
  public static renderImage(urls: string[]) {
    return Promise.all(urls.map((url) => Jimp.read(url)))
      .then((images) => {
        const h = Math.min(...images.map((j) => j.getHeight()));
        // tslint:disable-next-line:no-shadowed-variable
        for (const image of images) {
          image.scale(h / image.getHeight());
        }
        const widths = images.map((j) => j.getWidth());
        const image = new Jimp(widths.reduce((a, b) => a + b), h);
        for (let i = 0; i < images.length; i++) {
          image.composite(images[i], widths.slice(0, i).reduce((a, b) => a + b, 0), 0);
        }
        return image;
      });
  }

  public static wrapText(description: string | undefined | null, limit: number) {
    if (!description) {
      return 'No description';
    }
    const service = new TurndownService();
    description = service.turndown(description);
    const a = description.split('. ');
    let result: string = '';
    let count = 0;
    for (const [i, d] of a.entries()) {
      count += d.length;
      if (count > limit) {
        break;
      }
      if (i + 1 < a.length) {
        result += d + '. ';
      } else {
        result += d;
      }
    }
    return result;
  }
}
