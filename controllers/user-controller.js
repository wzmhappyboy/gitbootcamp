module.exports.getAllUsers = function (req, res, next) {
  let users = [
    {
      'id': 1,
      'name': 'ABC'
    },
    {
      'id': 2,
      'name': 'XYZ'
    },
  ]
  return res.status(200).json({ success: true, res: users }).end('');
}

