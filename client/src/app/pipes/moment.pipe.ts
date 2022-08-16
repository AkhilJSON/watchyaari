import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment/moment';

@Pipe({
  name: 'moment',
})
export class MomentPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    if (value && args && args[0]) {
      if (args[0] == '24hourFormat') {
        return moment.utc(value).local().format('HH:mm');
      }
      if (args[0] == 'exactTimeStamp') {
        return moment.utc(value).local().format('MMMM Do YY, h:mm a');
      }
      if (args[0] == 'relativeMoment') {
        let relativeMoment = moment(new Date(value)).fromNow();
        if (relativeMoment.includes('hours ago')) {
          return `Streamed ${relativeMoment}`;
        } else {
          return `Starts ${relativeMoment}`;
        }
      }
    }
    return '00:00';
  }
}
