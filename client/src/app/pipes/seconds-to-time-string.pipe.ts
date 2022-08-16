import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'secondsToTimeString',
})
export class SecondsToTimeStringPipe implements PipeTransform {
  transform(value: any, inputType?: any, ...args: unknown[]): unknown {
    if (inputType == 'number') {
      if (value) {
        let hours = <any>(value / (60 * 60));
        hours = parseInt(hours);

        let minutes = <any>((value - hours * 60 * 60) / 60);
        minutes = parseInt(minutes);

        let seconds = <any>(value - hours * 60 * 60 - minutes * 60);
        seconds = parseInt(seconds);

        let hourFormat = false;

        if (hours > 0) {
          hourFormat = true;
        }

        hours = hours.toString().padStart(2, '0');
        minutes = minutes.toString().padStart(2, '0');
        seconds = seconds.toString().padStart(2, '0');

        return `${hourFormat ? hours + ':' : ''}${minutes}:${seconds}`;
      } else {
        return '00:00';
      }
    }
    if (value) {
      let dateObj = new Date(value * 1000);
      let hours = dateObj.getUTCHours();
      let minutes = dateObj.getUTCMinutes();
      let seconds = dateObj.getSeconds();
      let timeString =
        (hours ? hours.toString().padStart(2, '0') + ':' : '') +
        (minutes.toString().padStart(2, '0') + ':') +
        seconds.toString().padStart(2, '0');
      return timeString;
    }
    return '00:00';
  }
}
