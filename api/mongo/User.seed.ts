import logger from '../config/logger';
import User from '../repositories/user/User.schema';

const seedData = async () => {
  const count = await User.countDocuments();
  if (count > 0) {
    logger.info('Database already seeded');
    return;
  }
  await User.insertMany(
    [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
      { name: 'David', email: 'david@example.com' },
      { name: 'Eve', email: 'eve@example.com' },
      { name: 'Frank', email: 'frank@example.com' },
      { name: 'Grace', email: 'grace@example.com' },
      { name: 'Heidi', email: 'heidi@example.com' },
      { name: 'Ivan', email: 'ivan@example.com' },
      { name: 'Judy', email: 'judy@example.com' },
      { name: 'Kevin', email: 'kevin@example.com' },
      { name: 'Lily', email: 'lily@example.com' },
      { name: 'Mallory', email: 'mallory@example.com' },
      { name: 'Nia', email: 'nia@example.com' },
      { name: 'Oscar', email: 'oscar@example.com' },
      { name: 'Peggy', email: 'peggy@example.com' },
      { name: 'Quentin', email: 'quentin@example.com' },
      { name: 'Rita', email: 'rita@example.com' },
      { name: 'Steve', email: 'steve@example.com' },
      { name: 'Trent', email: 'trent@example.com' },
      { name: 'Ursula', email: 'ursula@example.com' },
      { name: 'Victor', email: 'victor@example.com' },
      { name: 'Wendy', email: 'wendy@example.com' },
      { name: 'Xander', email: 'xander@example.com' },
      { name: 'Yvonne', email: 'yvonne@example.com' },
      { name: 'Zoe', email: 'zoe@example.com' },
    ],
    { ordered: false },
  );

  const followList = [
    {
      target: 'Alice',
      followers: ['Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace'],
      following: ['Bob', 'Eve', 'Wendy', 'Xander', 'Yvonne'],
    },
    { target: 'Bob', followers: ['Eve', 'Frank'], following: ['Alice', 'Charlie', 'David'] },
    { target: 'Charlie', followers: ['David', 'Eve', 'Frank', 'Grace'], following: ['Alice', 'Bob'] },
    { target: 'David', followers: ['Alice', 'Bob', 'Charlie', 'Eve'], following: ['Alice', 'Charlie'] },
    {
      target: 'Eve',
      followers: ['Alice', 'Bob', 'Charlie', 'David', 'Frank', 'Grace'],
      following: ['Alice', 'Bob', 'Charlie'],
    },
    { target: 'Frank', followers: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'], following: ['Alice', 'Charlie'] },
  ];
  followList.map(async (list) => {
    const user = await User.findOne({ name: list.target });
    if (!user) {
      logger.error('Alice not found');
      return;
    }
    const followers = await User.find({ name: { $in: list.followers } });
    const followings = await User.find({ name: { $in: list.following } });
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          followers: followers.map((follower) => follower._id),
          following: followings.map((following) => following._id),
        },
      },
    );
  });
  logger.info('User data is seeded');
};

export default seedData;
