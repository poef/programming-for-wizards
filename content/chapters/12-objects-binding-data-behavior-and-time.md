---
tags: programming for wizards
---

# Objects: binding data, behavior, and time

In the previous chapter we looked at the knitted castle: the strange tendency of software to grow threads. Every useful piece starts to depend on data shapes, frameworks, databases, styling, configuration, lifecycles, users, errors and history. Before long, the piece is no longer a brick. It is a tower with half the castle still attached.

Object Oriented Programming is one of the great historical answers to that problem. Perhaps the most successful one.

It promised a way to make software out of reusable pieces. Pieces that were not just functions, but little things that carried their own data and behavior around with them. Objects could be combined. Classes could be extended. The internal mess could be hidden. The outside world could talk to a smaller public surface.

That promise was powerful enough that OOP took over much of the programming world. For many programmers, programming became object-oriented programming. Classes, methods, inheritance, interfaces, constructors, services, factories: this became the normal furniture of software.

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

Or to inject the dependency when the object is created.

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

That lets you bind later.

## Binding time

We don't think enough about time. But ignoring it doesn't make it disappear. Instead it infects your careful design in unexpected places, then pops up when you no longer have the time to fix it.

When do we decide which database to use? When do we decide which template renders this page? When do we decide which implementation of an interface belongs in production and which one belongs in tests?

If you decide too early, your code becomes rigid. If you decide too late, your code becomes vague. Wizardry is not always delaying decisions. It is moving each decision to the place where it is cheapest to change and easiest to understand.

> **Wizard's tenth rule**
>
> Choose wisely when to choose.

This is where factories, [dependency injection containers](https://en.wikipedia.org/wiki/Dependency_injection), [service locators](https://martinfowler.com/articles/injection.html#UsingAServiceLocator), configuration files and plugin systems all come from. They are attempts to move binding.

Some of them help. Some of them merely move the mess to a more impressive room.

## Shell and core

One useful boundary is the shell/core split.

The core contains the rules of the program. It should know as little as possible about files, databases, networks, frameworks, clocks and random number generators. The shell knows about the outside world. It wires everything together.

The shell is where many decisions are allowed to be late.

This is not because the outside world is dirty and the core is pure. That sounds moralistic, and software is already full of enough false morality.

The reason is more practical. The outside world changes in different ways than the rules of your program. Databases change. Frameworks change. APIs change. Files move. Users do strange things. The core should be protected from that weather where possible.

This is the same move we have seen before. Change the boundary, and the problem changes shape. Then the problem gets bigger. Not one object, but the whole structure. Not one dependency, but change itself.

At a large enough scale, architecture is also a question of when things are allowed to become fixed.
