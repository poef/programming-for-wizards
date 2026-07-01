---
tags: programming for wizards
---
# Object Oriented Programming

OOP used to be the one true way of building software. today it has fallen of its pedestal a bit, functional programming is getting more and more of the limelight. Yet if you look at job postings and enterprise software, OOP is still king.

The roots of OOP go back to the 60's and 70's. A wizard called Alan Kay named the concept, when he invented SmallTalk. But there are roots in another language, called Simula, as well.

Alan Kay was working for the US Army, where they had a problem. Whenever they sent large data files, on big tapes, across the country to other military installations, they had to make sure that the computer on the other side could read the tapes. This was more difficult than you'd think, because the software to read them got updated frequently. Not all computers where updated at the same time, so sometimes the computer would have out of date software.

To solve this, he came up with a simple solution: Add the reader software to the tape at the start. This way you would always have the correct reader for the tape you were reading.

This is the root idea for Object Oriented Programming. Tie the code to the data that it is operating on, this way you always have the correct code.

## In practice: Configuration and Dependency Injection

One of the main problems developers face is how to configure software. Any non-trivial piece of software will contain lots of modules that are combined together to achieve its intended task.

Writing quality code is difficult and time consuming, so you want to be able to re-use as much code as you can. This leads to having to configure the code you want to re-use. For example, tell the code which database to use, or which files to read.

The easiest way to do this is to add a few global variables and use these in your code:

```php=
<?php
    $database = "mysql:host=localhost;dbname=mydb;charset=UTF8";

    class db {
        static function connect($dsn) {
            ...
        }
        static function query($query) {
            global $database;
            $db = self::connect($database);
            return $db->query($query);
        }
    }

    $result = db::query($myquery);
```

*Note: this is not example code to follow*

However, this is not very safe. Any piece of code can access and alter these variables at any time. Additionally, any code you write will have to use these exact same variables. And finally, what happens if you want to access two databases?

So instead we pass the configuration to the class, like this:

```php=
<?php
    $database = "mysql:host=localhost;dbname=mydb;charset=UTF8";

    class db {
        private $connection;

        function __construct($dsn) {
            $this->connection = $this->connect($dsn)
        }
        
        function query($query) {
            return $this->connection->query($query);
        }
    }

    $db = new db($database);
    $result = $db->query($myquery);
```
*Note: this is still not code to follow*

This is a bit better, you can now connect to multiple databases if you want, and any code that uses the `$db` variable cannot change the connection anymore.

However, any other classes that want to access the database now must know which database to use. A simple (and wrong) way to do this is:

```php=
<?php
    class userRepository {
        private $db;
        function __construct() {
            global $database;
            $this->db = new db($database);
        }
        function list() {
            return $this->db->query('select id, name from users');
        }
    }
```
*Note: still the wrong code to follow*

This just goes back to the first example, using global variables. Instead the userRepository class must be told which databse to use. So a slightly better version of this code would be:

```php=
<?php
    class userRepository {
        private $db;
        function __construct($database) {
            $this->db = new db($database);
        }
        function list() {
            return $this->db->query('select id, name from users');
        }
    }
```
*Note: not there yet*

But now we need to tell the userRepository class which database connection string to use. But the userRepository just passes it on to the db class. And if we create another class that wants to use the userRepository, it also needs this database connection string. You can see that this will get out of hand fairly quickly.

So instead of telling the userRepository how to instantiate the db class, why don't we do that for it:

```php=
<?php
    class userRepository {
        private $db;
        function __construct($db) {
            $this->db = $db;
        }
        function list() {
            return $this->db->query('select id, name from users');
        }
    }

    $database = "mysql:host=localhost;dbname=mydb;charset=UTF8";
    $db = new db($database);
    $users = new userRepository($db);
    $result = $users->list();
```
*Note: this is actually ok, but a lot of work*

This is where things get interesting. In any larger piece of software, the database connection will be needed by many different classes. And classes that use other classes. And there will be many more of these services. So some smart people figured out that it would be easier to collect these services, like the `$db` variable into a single object. Like this:

```php=
<?php
    $services = new object();
    $services->database = "mysql:host=localhost;dbname=mydb;charset=UTF8";
    $services->db = new db($services);
    $services->users = new userRepository($services)
```
*Note: and back to bad example code again*

Instead of having to figure out which parameter or dependency to pass to each class constructor, we now made each constructor require just one parameter, that of the service locator object. This saves a lot of typing and thinking.

However, we are instantly back at the original problem. Instead of using a set of global variables, we are now using a single service locator object. But it has all the same problems. There is one improvement. In theory you could create a new service locator with a different database connection. But because the service locator will collect many, many different services, in practice its just too much work to do that.

In addition we've created another, more insidious problem. Each class has an identical constructor, that gives it access to all other services. You can't tell which of those services it actually needs, because that is hidden in the class code. Debugging and testing this code becomes problematic. And there is no guidance to other developers about the structure of your software, so the code will turn into a big pile of spaghetti very quickly.

Let's introduce a factory function:

```php=
<?php
    function usersFactory() {
        $database = "mysql:host=localhost;dbname=mydb;charset=UTF8";
        $db = new db($database);
        return new userRepository($db);
    }

    $users = usersFactory();
    $result = $users->list();
```
*Note: this code is also flawed, but we're getting there, hold on*

We've hidden all the busywork of creating a `users` object inside a single function called `usersFactory`. Now anytime you need a `users` object, you can call the factory and a new one will be made for you. You don't need to know how, the factory knows.

This solves an important issue. You no longer have lots of pieces of code distributed in your software that have to know about the database or `db` class. Just the factory. But how does the factory know this? Its obviously a bad idea to hardcode it in the code like shown here.

So lets re-introduce a configuration object:

```php=
<?php
    class Container {};
    $settings = new Container();
    $settings->database = "mysql:host=localhost;dbname=mydb;charset=UTF8";

    function usersFactory($settings) {
        $db = new db($settings->database);
        return new userRepository($db);
    }

    $users = usersFactory($settings);
    $result = $users->list();
```
*Note: this code is acceptable*

Hold on. Why is this code ok, but the service locator is not? Isn't this just the same thing? Well, allmost. The difference is subtle but important.

First, the `$settings` container only contains settings, not instantiated objects. However this is not really important. There are certainly cases where you only want one instance of a service, and re-use that througout your code. In that case it is a very good fit to add that instance to your container.

More important however, is that the constructors of `db` and `userRepository` do not know about the existance of the `$settings` container. Only the `usersFactory` method does. This is an important distinction, and a rule to follow. Constructors should only specify what they need to function, they should not known how to get it.

By following that simple rule, your classes become much more flexible. The theory behind this concept is called 'late binding'. When you write code in your constructor that creates a new object, this means that these two classes are now bound in code /inside/ the classes themselves. You can never use the `userRepository` class without also using that exact `db` class. 

The problem is slightly alleviated in the service locator example. You can create a different service locator that uses a different class for the `$services->db` instance. But each class that uses it, has to know the exact name of the needed service in that locator. If you ever need two `db` instances, you will end adding a `$service->db2` instance. And since it is hard to know which services are needed by which classes, you service locator will only grow and grow.

The last example changes this in an important way. Since each class has no knowledge of the container, lets call it an dependency injection container from now on, the classes aren't bound to each other, untill the moment that they are created, runtime. Since this is clearly later (timewise) than binding while writing the code, this is called late binding. There are many other things that you can call late binding, and I have found no example where it is a bad idea.

Now, there is still binding going on, in code, in the factory method. So clearly this is still early binding right? Well, yes, but the location matters. Remember, software architecture is about how to handle change. You want to minimize the changes to your code needed to respond to change. In the last example, you can change just the factory function, or even create a new distinct factory function, to incorporate your change. The `userRepository` and `db` class don't need to change at all.

## Shell vs. Core

The factory function is part of what I call the glue layer of your software, while the classes are the business logic. You might also call it shell vs. core. There are many names for this same concept.

The basic idea is that your core, or business logic changes very rarely. Only when the problem domain or business itself changes. The glue or shell will change much more often, whenever anything in the interaction with its environment changes.

Now, to make effective use of this seperation, you should strive to keep most decisions, most logic, out of the glue layer. It should only be about connecting your seperate classes together correctly. All the logic and decisions should be encapsulated there.

Allright, so lets make it a bit more difficult. What happens if the `userRepository` class needs to return a list of objects, instead of raw data. How do you solve this in a glue/logic (or shell/core) way?

First we create a class to contain the user data, like this:

```php=
    class user {
        public $id, $name;
        function __construct($id, $name) {
            $this->id = $id;
            $this->name = $name;
        }
    }
```
This is a very simple class for now. But it still part of the core, just like the `userRepository` class. That means the `userRepository` must not know about the `user` class, and certainly not how to build it. But the `userRepository` does need to create a list of users. So lets make a factory method for that, *and pass the factory method as a dependency!*

```php=
    function userListFactory($dbList) {
        $users = [];
        foreach($dbList as [$id, $name]) {
            $users[] = new user($id, $name);
        }
        return $users;
    }
```

```php=
    class userRepository {
        private $db, $userListFactory;
        function __construct($db, $userListFactory) {
            $this->db = $db;
            $this->userListFactory = $userListFactory;
        }
        function list() {
            return $this->userListFactory($this->db->query('select id, name from users'));
        }
    }
```
We've added the `userListFacory` as a dependency in the constructor of `userRepository`, so we must change the `usersFactory` as well:

```php=
    function usersFactory($settings) {
        $db = new db($settings->database);
        return new userRepository($db, 'userListFactory');
    }
```

And now the remaining glue code can stay the same:

```php=
    class Container {};
    $settings = new Container();
    $settings->database = "mysql:host=localhost;dbname=mydb;charset=UTF8";
    
    $users = usersFactory($settings);
    $result = $users->list();
```

The core code consists of the two classes `userRepository` and `user`, who both don't know anything about any other code, except through their dependencies in the constructor.

There is still a single factory method that you actually use in your shell code, the `usersFactory`. Only the factory methods use the dependency injection container, and only the factory methods know how the different parts of the core are wired together.

If your core needs to change, and with it how you construct a certain class from the core, there is only one place in your shell code that needs to change and that is its factory function. No other code in the core needs to change.

## Dependency Injection in the wild

There are lots of PHP frameworks that use Dependency Injection, usually with a Container. But it is very common to see that container being passed to other classes in their constructors. That is not a good idea, before you know it that container has become a Service Locator and you no longer know which of your classes depend on which other classes.

Another common pitfall is to create a single magic factory method, which you only pass the name of the class to build. From that the magic method looks up how to build that class. Sometimes such a method even reads and parses your class constructor code or comments to see which dependencies are declared there. If it works, it seems magical. And then you need two different factory methods for the same class and you are back to writing your own factory method from scratch that works unlike all the rest.

Adding factory methods to the dependency injection container itself is not necessarily bad. Both are in the same realm, that of the shell or glue code. But by doing that, the step to pass on the dependency injection container to the constructor of another class becomes more tempting. By creating seperate functions or static methods, you avoid the possibility of making that mistake altogether.
