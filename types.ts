
export interface Reservation {
  bookingNumber: string;
  guestName: string;
  checkInDate: string; // "DD.MM.YYYY"
  checkOutDate: string; // "DD.MM.YYYY"
  grossAmount: number;
  bookingCommission: number;
  transactionFee: number;
}
