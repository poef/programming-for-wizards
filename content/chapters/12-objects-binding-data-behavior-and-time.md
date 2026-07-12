---
tags: programming for wizards
---

# Boundaries: Data, behavior, and time

In the previous chapter we looked at the knitted castle: the strange tendency of software to grow threads. Every useful piece starts to depend on data shapes, frameworks, databases, styling, configuration, lifecycles, users, errors and history. Before long, the piece is no longer a brick. It is a tower with half the castle still attached.

Object-Oriented Programming is one of the great historical answers to that problem. Perhaps the most successful one.

It promised a way to make software out of reusable pieces. Pieces that were not just functions, but little things that carried their own data and behavior around with them. Objects could be combined. Classes could be extended. The internal mess could be hidden. The outside world could talk to a smaller public surface.

That promise was powerful enough that OOP took over much of the programming world. For many programmers, programming became object-oriented programming.

And yet the knitted castle did not go away.

So I will not start with a definition of OOP. Definitions are where this subject goes to become religious. I will start with the promise, and with the part of the promise that still matters.

Where should behavior live?

If you have data in one place and all the code that works on that data somewhere else, the distance between the two becomes part of the problem. Every change requires you to remember the connection. Every reader has to rebuild the connection in their head.

OOP's answer is: bind the behavior to the data. Put the methods where the state is. Make the thing responsible for its own rules.

This is a good direction. It's not the whole answer, but it's not nothing either.

## Classes and objects

A class is often explained as a blueprint. An object is the thing built from that blueprint. This is good enough for a first approximation, and dangerous if you believe it too deeply.

The more important idea is that an object carries a small world around with it. It has state, and it has behavior that is allowed to touch that state. A good object hides its messy insides and exposes a smaller language to the rest of the program.

That language can be pleasant. It can also become a trap.

```php
$order->pay($payment);
$order->ship($address);
$order->cancel($reason);
```

This code tells a little story. It is better than pushing random arrays through random functions. But the story depends on the object having the right boundaries. If `Order` knows about databases, mailers, HTTP requests, payment gateways, templates and logging, it is no longer a small world. It is a knitted castle with a nice name.

## Dependencies

The real trouble often starts when an object needs something from the outside world.

For example, an order may need to save itself. The tempting thing is to let it create the thing it needs.

```php
class Order {
    public function save() {
        $db = new DatabaseConnection();
        $db->save($this);
    }
}
```

This looks convenient, and convenience is one of the most dangerous forms of magic. The `Order` class now decides not only what an order is, but also where databases come from. If the database changes, the order changes. If you want to test the order, you need a database or a trick.

The dependency is hidden.

A cleaner version is to ask for what you need.

```php
class Order {
    public function save(OrderRepository $orders) {
        $orders->save($this);
    }
}
```

Or even better: inject the dependency when the object is created.

```php
class OrderService {
    public function __construct(private OrderRepository $orders) {}

    public function ship(Order $order, Address $address) {
        $order->ship($address);
        $this->orders->save($order);
    }
}
```

Forget the frameworks, the annotations, and the containers with configuration files so large that they need their own weather report.

Instead the useful idea is simple:

> The place that uses a dependency does not have to be the place that chooses it.

That lets you bind later. The simplest version of this is:

```php
$orders = new SqlOrderRepository($database);
$service = new OrderService($orders);
```

Or encapsulated in a factory function:

```php
function createOrderService(DatabaseConnection $database) {
    return new OrderService(
        new SqlOrderRepository($database)
    );
}
```

The key idea: the factory is separate from the `SqlOrderRepository` and the `OrderService`. You can replace it or add different versions. You can bind the parts together when you need them, rather than having that choice built into one of the parts.

## Binding time

We don't think enough about time. But ignoring it doesn't make it disappear. Instead it infects your careful design in unexpected places, then pops up when you no longer have the time to fix it.

When do we decide which database to use? When do we decide which template renders this page? When do we decide which implementation of an interface belongs in production and which one belongs in tests?

If you decide too early, your code becomes rigid. If you decide too late, your code becomes vague. Wizardry is not always delaying decisions. It is moving each decision to the place where it is cheapest to change and easiest to understand.

> **Wizard's tenth rule**
>
> Choose wisely when to choose.

This is where factories, [dependency injection containers](https://en.wikipedia.org/wiki/Dependency_injection), [service locators](https://martinfowler.com/articles/injection.html#UsingAServiceLocator), configuration files and plugin systems all come from. They are attempts to move binding.

Some of them help. Some of them merely move the mess to a more impressive room.

Passing a container into every object looks flexible, but it hides what each object actually needs. The dependencies become visible only after you read the implementation.

## Binding reveals boundaries

Dependencies are not a problem if they live their entire life inside the boundary of a single part. They become a problem when they escape.

It is your job to identify potential boundaries, and keep the threads from crossing.

A potential boundary appears when two things change for different reasons. The rules of an order change when the business changes. The repository changes when the database or storage changes. The factory changes when we decide to connect the parts differently.

Look for code that knows something only because two other parts need to meet. That code may be a bridge. Look for decisions that one part uses but should not own. That may be a boundary. Look for things that change at different times, or for different people. They probably should not be tied together.

## Shell and core

One useful boundary is the shell/core split.

The core contains the rules of the program. It should know as little as possible about files, databases, networks, frameworks, clocks and random number generators. The shell knows about the outside world. It wires everything together.

Factory spells clearly belong in the shell. This is where the Lego blocks are connected. I sometimes use the term "glue layer", but gluing Lego bricks together is frowned upon. A factory is a specific version of a pattern I've been using a lot: the bridge. Instead of two or more components having to know about each other, with threads connecting them, only the bridge knows how to tie the knots.

Boundaries are not found by drawing boxes first. They appear when you notice that two things know too much about each other, change for different reasons, or must be connected by knowledge that belongs to neither.