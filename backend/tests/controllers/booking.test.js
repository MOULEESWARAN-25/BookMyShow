const { createBooking } = require("../../controllers/booking");

const fakeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("createBooking: checks before the database", () => {
  test("refuses more than 10 seats", async () => {
    const req = {
      body: {
        showId: 1,
        seats: [
          "A1",
          "A2",
          "A3",
          "A4",
          "A5",
          "A6",
          "A7",
          "A8",
          "A9",
          "A10",
          "A11",
        ],
      },
    };
    const res = fakeRes();

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "You can book at most 10 seats at a time",
    });
  });
});
