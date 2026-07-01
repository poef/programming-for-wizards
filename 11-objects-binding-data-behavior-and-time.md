---
tags: programming for wizards
---

# Objects: binding data, behavior, and time

Object Oriented Programming is one of those subjects where everyone thinks they know what it means, right up until two programmers try to define it in the same room.

So I will not start with the definition. I will start with the problem.

Where should behavior live?

If you have data in one place and all the code that works on that data somewhere else, the distance between the two becomes part of the problem. Every change requires you to remember the connection. Every reader has to rebuild the connection in their head.

One answer is: bind the behavior to the data. Put the methods where the state is. Make the thing responsible for its own rules.

That is one useful idea hiding inside OOP.

> **Interactive exhibit placeholder: `where-should-behavior-live`**
>
> Show a tiny order system as loose records plus functions. Then show it as objects with methods. Let the reader change an invariant, such as "an order may not ship before payment". Highlight how far the change has to travel in each representation.

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

This is the useful core of dependency injection. Not the frameworks. Not the annotations. Not the containers with configuration files so large that they need their own weather report.

The useful idea is simple:

> The place that uses a dependency does not have to be the place that chooses it.

That lets you bind later.

## Binding time

A surprising amount of software design is about binding time.

When do we decide which database to use? When do we decide which template renders this page? When do we decide which implementation of an interface belongs in production and which one belongs in tests?

If you decide too early, your code becomes rigid. If you decide too late, your code becomes vague. Wizardry is not always delaying decisions. It is moving each decision to the place where it is cheapest to change and easiest to understand.

This is where factories, dependency injection containers, service locators, configuration files and plugin systems all come from. They are attempts to move binding.

Some of them help. Some of them merely move the mess to a more impressive room.

> **Interactive exhibit placeholder: `binding-time-slider`**
>
> Show the same dependency bound in three places: inside the class, in a factory, and at the application shell. Let the reader swap the database implementation. Count how many pieces change and how much of the program needs to know.

## Shell and core

One useful boundary is the shell/core split.

The core contains the rules of the program. It should know as little as possible about files, databases, networks, frameworks, clocks and random number generators. The shell knows about the outside world. It wires everything together.

This is not because the outside world is dirty and the core is pure. That sounds moralistic, and software is already full of enough false morality.

The reason is more practical. The outside world changes in different ways than the rules of your program. Databases change. Frameworks change. APIs change. Files move. Users do strange things. The core should be protected from that weather where possible.

This is the same move we have seen before. Change the boundary, and the problem changes shape.

> **Wizard move**
>
> Do not only ask what a thing depends on. Ask where that dependency should be bound.
