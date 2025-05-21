import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/sqlite";

@Entity()
class Person {
  @PrimaryKey()
  id!: number;

  @Unique()
  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [Person],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("rollback without flushing", async () => {
  const em = orm.em.fork();

  await em.begin();
  em.create(Person, {
    id: 0,
    name: "John",
  });
  await em.rollback();

  await em.begin();
  em.create(Person, {
    id: 1,
    name: "Jane",
  });
  await em.commit();

  const people = await em.findAll(Person);
  expect(people).toHaveLength(1);
});
