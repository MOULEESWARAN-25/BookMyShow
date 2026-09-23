require("dotenv").config();
const { Sequelize } = require("sequelize");
const { Umzug, SequelizeStorage } = require("umzug");
const sequelize = require("./sequelize");

// Migrations run top to bottom. Add new migrations to the end of this list.
const MIGRATIONS = [
  "create-users",
  "create-sessions",
  "create-theatres",
  "create-movies",
  "create-shows",
  "create-show-seats",
  "create-bookings",
  "create-booking-seats",
];

const queryInterface = sequelize.getQueryInterface();

const umzug = new Umzug({
  migrations: MIGRATIONS.map((name) => {
    const migration = require(`../migrations/${name}`);
    return {
      name: `${name}.js`,
      up: () => migration.up(queryInterface, Sequelize),
      down: () => migration.down(queryInterface, Sequelize),
    };
  }),
  context: queryInterface,
  storage: new SequelizeStorage({ sequelize }),
  logger: undefined,
});

const commands = {
  up: async () => {
    const applied = await umzug.up();
    console.log(
      applied.length
        ? `Migrated: ${applied.map((m) => m.name).join(", ")}`
        : "No pending migrations",
    );
  },
  down: async () => {
    const reverted = await umzug.down();
    console.log(
      reverted.length
        ? `Reverted: ${reverted.map((m) => m.name).join(", ")}`
        : "No migrations to revert",
    );
  },
  "down:all": async () => {
    const reverted = await umzug.down({ to: 0 });
    console.log(
      reverted.length
        ? `Reverted: ${reverted.map((m) => m.name).join(", ")}`
        : "No migrations to revert",
    );
  },
  status: async () => {
    const executed = await umzug.executed();
    const pending = await umzug.pending();
    executed.forEach((m) => console.log(`up    ${m.name}`));
    pending.forEach((m) => console.log(`down  ${m.name}`));
  },
};

const command = commands[process.argv[2]];
if (!command) {
  console.error(`Usage: node db/migrate.js <${Object.keys(commands).join("|")}>`);
  process.exit(1);
}

command()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(`Migration failed: ${error.message}`);
    await sequelize.close();
    process.exit(1);
  });
