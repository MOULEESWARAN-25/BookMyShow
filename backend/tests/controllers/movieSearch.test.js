// Fake everything the movie list talks to: the database, OpenSearch, the cache and the logger.
jest.mock("../../models", () => ({
  sequelize: { literal: jest.fn() },
  Movie: { findAll: jest.fn() },
  Show: {},
  Theatre: {},
}));
jest.mock("../../utils/movieSearch", () => ({ searchMovieIds: jest.fn() }));
jest.mock("../../utils/cache", () => ({
  moviesCacheKey: () => "cache:movies",
  showsCacheKey: jest.fn(),
  getCached: jest.fn(),
  clearCache: jest.fn(),
}));
jest.mock("../../queues/searchIndex", () => ({ addIndexMovieJob: jest.fn() }));
jest.mock("../../utils/logger", () => ({ logger: { warn: jest.fn() } }));

const { Movie } = require("../../models");
const { searchMovieIds } = require("../../utils/movieSearch");
const { listMovies } = require("../../controllers/movie");

const fakeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("movie search", () => {
  test("shows results in OpenSearch's best-match order, not A to Z", async () => {
    searchMovieIds.mockResolvedValue([3, 1]);
    Movie.findAll.mockResolvedValue([
      { id: 1, title: "Ashes of Hampi" },
      { id: 3, title: "Neon Coast" },
    ]);
    const req = { query: { search: "neon" } };
    const res = fakeRes();

    await listMovies(req, res);

    expect(searchMovieIds).toHaveBeenCalledWith("neon");
    expect(res.status).toHaveBeenCalledWith(200);
    const { movies } = res.json.mock.calls[0][0];
    expect(movies.map((movie) => movie.id)).toEqual([3, 1]);
  });
});
