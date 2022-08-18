import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "controlText",
})
export class ControlTextPipe implements PipeTransform {
    transform(value: any, maxAllowedLength: any, ...args: unknown[]): unknown {
        if (value) {
            let trimmedValue = value.length > maxAllowedLength ? value.slice(0, maxAllowedLength) : value;
            trimmedValue = trimmedValue.trim();
            trimmedValue = value.length > maxAllowedLength ? `${trimmedValue}...` : trimmedValue;
            return trimmedValue;
        }
        return "";
    }
}
