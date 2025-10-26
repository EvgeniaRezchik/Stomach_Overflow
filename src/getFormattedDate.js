function getFormattedDate(dateObject) {
  if (!(dateObject instanceof Date)) {
    return "";
  }
  let date = "";
  let dateNumber = dateObject.getDate();
  let month = dateObject.getMonth() + 1;
  let hours = dateObject.getHours();
  let minutes = dateObject.getMinutes();
  if (dateNumber >= 1 && dateNumber <= 9) {
    date += "0";
  }
  date += dateNumber;
  date += ".";
  if (month >= 1 && month <= 9) {
    date += "0";
  }
  date += month;
  date += ".";
  date += dateObject.getFullYear();
  date += " ";
  if (hours >= 0 && hours <= 9) {
    date += "0";
  }
  date += hours;
  date += ":";
  if (minutes >= 0 && minutes <= 9) {
    date += "0";
  }
  date += minutes;
  return date;
}
export default getFormattedDate;

