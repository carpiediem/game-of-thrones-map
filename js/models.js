angular.module('quartermaester')

.factory('User', function (Organisation) {

  /**
   * Constructor, with class name
   */
  function User(firstName, lastName, role, organisation) {
    // Public properties, assigned to the instance ('this')
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.organisation = organisation;
  }

  /**
   * Public method, assigned to prototype
   */
  User.prototype.getFullName = function () {
    return this.firstName + ' ' + this.lastName;
  };

  /**
   * Private property
   */
  var possibleRoles = ['admin', 'editor', 'guest'];

  /**
   * Private function
   */
  function checkRole(role) {
    return possibleRoles.indexOf(role) !== -1;
  }

  /**
   * Static property
   * Using copy to prevent modifications to private property
   */
  User.possibleRoles = angular.copy(possibleRoles);

  /**
   * Static method, assigned to class
   * Instance ('this') is not available in static context
   */
  User.build = function (data) {
    if (!checkRole(data.role)) {
      return;
    }
    return new User(
      data.first_name,
      data.last_name,
      data.role,
      Organisation.build(data.organisation) // another model
    );
  };

  /**
   * Return the constructor function
   */
  return User;
})
