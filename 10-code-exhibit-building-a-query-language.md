---
tags: programming for wizards
---

# Code exhibit: building a query language

Now we stop merely admiring spells and make one.

The previous chapter ended with Domain Specific Languages. This chapter is a workshop: a small query language, built from tokenizer to parser to SQL and PHP output.

The purpose is not that this particular language is perfect. It isn't. The purpose is to feel the boundary. Once you create a real language, even a tiny one, you get to decide what can be said inside that language and what must stay outside it.

> **Interactive exhibit placeholder: `query-language-lab`**
>
> Make this chapter interactive in four panes: query input, tokens, parse tree, output. Let the reader type `lastName~="O%" and address.city="Manchester"` and watch the tokenizer, parser, SQL transpiler and PHP filter update. Keep the implementation small enough that the reader can inspect it.

As I argued in the Programming for Wizards chapter about Language, you should be able to write a Domain Specific Language to help solve problems. To show you that almost any modern language has the tools to help you do that, this chapter shows how you can write a simple DSL in PHP.

Here I'll show you how to write a query language parser using a regular expression based tokenizer and a transformer to turn it into SQL as well as a PHP filter function.

Let's start with a definition of the query language. 

## The query language

Imagine we've build a database system in which you can store any kind of JSON data. This store needs a query system so that you can quickly return JSON objects that match the query. You can't just use SQL, because the database isn't actually using a relational database.

One way to do this is to build a class in PHP that lets you build a query, using methods. While this works, it is often very verbose. So let's write a new language instead!

The language should allow us to query for specific values in JSON, e.g.:

```
firstName="Stan"
address.street="Coronation Street"
```

It should allow for logical operators:
```
address.street="Coronation Street" and address.city="Manchester"
```

And for grouping:
```
(lastName="Ogden" or lastName="Webster") and address.street="Coronation Street"
```

And wildcard matching:
```
lastName~="O%"
```

There are a number of comparison operators in the language, here is the full list:

```
=     equals
!=    does not equal
~=    matches with wildcards
!~    does not match
>     greater than
>=    greater or equal
<     less than
<=    less or equal
?     has this property
```

The first thing to build is a tokenizer.

## Building a tokenizer using regular expressions

Regular expressions have a bad reputation for being unreadable. But using the `/x` modifier, and named capture groups, you can actually write mostly readable regular expressions.

For example, this is the regular expression to match the comparison operators:

```
(?<compare>
   <= | >= | <> | < | > | = | != | ~= | !~ | \?
)
```

And in PHP you would use it like this:

```php
<?php
$re = <<<'REGEX'
/(?<compare>
   <= | >= | <> | < | > | = | != | ~= | !~ | \?
)/xi
REGEX;

$query = '>=';
if (preg_match($re, $query, $matches)) {
    var_dump($matches);
}
```
This regular expression uses two advanced concepts. One is the '/x' modifier. This makes all white-space meaningless in the regular expression. So now you can add indentation. The second is the named capture groups, here in the form of `<compare>`. The full format for this is `(?<compare> .* )`. 

When you use a named capture group, you can assign a name to parts of the string being matched, and you can refer back to that part later in the regular expression. In addition, preg_match will add the name in the matches array it returns. 

If you run this code it outputs:
```
array(3) {
  [0]=>
  string(2) ">="
  ["compare"]=>
  string(2) ">="
  [1]=>
  string(2) ">="
}
```

The matches array always returns the whole matched part as key '0'. Any parenthesis match is returned with a numeric key, indicating the order in which it appears in the regular expression. But the nice part about named capture groups is that the matches array also has a key with the name of the capture group. So now we can see that '>=' matches the 'compare' group, and we can build a complete tokenizer.

Below are all the different tokens and their regular expressions:

```
(?<compare>
   <= | >= | <> | < | > | = | != | ~= | !~ | \?
)
|
(?<operator>
    and | or
)
|
(?<not>
    not
)
|
(?<parenthesis_open>
    \(
)
|
(?<parenthesis_close>
    \)
)
|
(?<number>
    [+-]?[0-9]+(\.[0-9]+)?
)
|
(?<name>
    [a-z]+[a-z0-9_-]*
    (?: \. [a-z]+[a-z0-9_-]* )*
)
|
(?<string>
    "(?:\\.|[^\\"])*"
)
```

Ok, so the last two, `<name>` and `<string>` are getting a bit complex. Let's start with `<name>`. It uses something called a '[non-capturing subpattern](https://www.php.net/manual/en/regexp.reference.subpatterns.php)', denoted with the form `(?: .* )`. Normal subpatterns have the form `( .* )`, and result in extra entries in the `$matches` array. By adding `?:` immediately after the opening brace, this entry is skipped. So in this case it means that the entire `<name>` match is the only one added to the `$matches` array.

The `<string>` expression is complex, because it must support escaping. Without the ability to use the quote character in a string, the expression would simply be:

```
(?<string>
    "[^"]*"
)
```

However, you must be able to set a value string like this: `"a \" quote"`. 
To do that, we're matching two possible strings: First any character that is preceded by a `\` - `\\.`, or any character that is not either a quote or a backslash - `[^\\"]`.

The negative look ahead means that only content that isn't a quote is matched, unless the quote is preceded by a `\`.

It is easy to get confused reading regular expressions, I find the website [regex101.com](https://regex101.com/) invaluable to test and alter regular expressions. 

In addition, you don't always need to figure out the exact regular expression you need by yourself. There is a good collection of well tested regular expressions at [rgxdb.com](https://rgxdb.com/).


The full tokenizer is a PHP function that uses the regular expression:

```php=
function tokenizer($query) {
    $token = '....'; // <- add regular expression here
    do {
        $result = preg_match($token, $query, $matches);
        if ($result) {
            $query = substr($query, strlen($matches[0]));
            yield $matches[0];
        }
    } while($result);
    if ( trim($query) ) {
        throw new \LogicException('Could not parse '.$query);
    }
}
```

The code above is all we need for the tokenizer. As long as `preg_match` matches the query string, the tokenizer keeps yielding tokens. Every matched token is cut of the start of the query string.

If there are non-whitespace characters left in the query string when preg_match no longer matches any tokens, that means that the query string doesn't match the query language, so the tokenizer throws a parse error.

There is one problem however, the token regular expression skips white space characters and now they won't get counted when cutting the matched token from the query string. To fix this, we use the PREG_OFFSET_CAPTURE option to `preg_match`:

```
    do {
        $result = preg_match($token, $query, $matches, PREG_OFFSET_CAPTURE);
        if ($result) {
            $query = substr($query, strlen($matches[0][0])+$matches[0][1]);
            yield array_filter(
                $matches,
                function($val, $key) {
                    return !is_int($key) && $val[0];
                }, 
                ARRAY_FILTER_USE_BOTH
            );
        }
    } while($result);
```

In addition the code above returns the token type that was matched, as well as the offset of the match. The query string is cut by the length of the match (`strlen($matches[0][0]`) as well as the offset (`$matches[0][1]`). The token yielded looks like this:

```
[
    "type" => [
        "value",
        offset
    ]
]
```

You can see the full code for this [tokenizer in arc/store](https://github.com/Ariadne-CMS/arc-store/blob/master/src/store.php#L122), which is a nosql json object store. Or you can test the code in a [PHP sandbox here](http://sandbox.onlinephpfunctions.com/code/2d2dea3b0b40cd1ebb6917c07200ed0c8a3de828).

## Parsing and transpiling to Postgres SQL format

The next step is to convert the query to a format that we can use to actually find matching objects. The storage layer for this is Postgres, as it has excellent support for JSON objects.

The basic parser loop looks like this:

```php=
function parser($query) {
    $sql = [];
    foreach( tokenizer($query) as $token) {
        $type = key($token);
        list($value,$offset) = $token[$type];
        switch($type) {
            // build the sql here 
        }
    }
    return implode(' ',$sql);
}
```

The `tokenizer` function yields each token in turn, so it doesn't actually get called here more than once. Instead it returns an iterator that is used in the foreach loop.

For each token we the tokenizer returns the type--the name of the capture group in the regular expression, the actual value and the offset in the query string where the token starts. The last one is valuable for debug messages.

Now the tokenizer doesn't care about the order in which tokens are presented in the query string, but the parser should. For this we introduce the `$expect` variable. It keeps track of which kind of token the tokenizer should return next. Initially this must be either a `name` or a `parenthesis_open`.

The SQL is first build as an array. This avoids thinking about whitespace for now, and allows the parser to alter a previously parsed token.

```php=
function parser($query) {
    $sql = [];
    $expect = 'name|parenthesis_open';
    foreach( tokenizer($query) as $token) {
        $type = key($token);
        list($value,$offset) = $token[$type];
        if (!preg_match("/^$expect$/", $type)) {
            throw new \LogicException('Parse error - expected '
                .$expect.', got '.$type.' instead.');
        }
        switch($type) {
            // build the sql here 
        }
    }
    return implode(' ',$sql);
}
```

Now the parser will complain by throwing an exception when you give it a query string that doesn't start with a name or parenthesis open. It doesn't parse the next token correctly, since the `$expect` variable isn't updated. let's add that.


```php=
function parser($query) {
    $sql = [];
    $expect = 'name|parenthesis_open';
    foreach( tokenizer($query) as $token) {
        $type = key($token);
        list($value,$offset) = $token[$type];
        if (!preg_match("/^$expect$/", $type)) {
            throw new \LogicException('Parse error - expected '
                .$expect.', got '.$type.' instead.');
        }
        switch($type) {
            case 'number':
            case 'string':
                $expect = 'operator|parenthesis_close';
            break;
            case 'name':
                $expect = 'compare';
            break;
            case 'compare':
                $expect = 'number|string';
            break;
            case 'operator':
                $expect = 'name|parenthesis_open';
            break;
            case 'parenthesis_open':
                $expect = 'name|parenthesis_open';
            break;
            case 'parenthesis_close';
                $expect = 'operator';
            break;
        }
    }
    return implode(' ',$sql);
}
```

This will parse the whole query string and throw an error if it can't be parsed. However it won't tell you exactly where the error in the query string is. We can improve that:

```php=
function parser($query) {
    $sql      = [];
    $expect   = 'name|parenthesis_open';
    $position = 0;
    
    foreach( tokenizer($query) as $token) {
        $type = key($token);
        list($value,$offset) = $token[$type];
        if (!preg_match("/^$expect$/", $type) {
            throw new \LogicException('Parse error at '.$position
                .'- expected '.$expect.', got '.$type.' instead: '
                .substr($query,0,$position).' --> '
                .substr($query,$position));
        }
        switch($type) {
            // ... snipped for brevity
        }
        $position += $offset + strlen($value);
    }
    return implode(' ',$sql);
}
```

Now the parser will tell you where the problem is with the query string. However it doesn't allow for nested parenthesis pairs, which it really should. So lets add that:

```php=
function parser($query) {
    $sql      = [];
    $expect   = 'name|parenthesis_open';
    $position = 0;
    $indent   = 0;
    
    foreach( tokenizer($query) as $token) {
        // ... snipped for brevity
        switch($type) {
            // ... snipped for brevity
            case 'parenthesis_open':
                $indent++;
                $expect = 'name|parenthesis_open';
            break;
            case 'parenthesis_close':
                $indent--;
                if ($indent>0) {
                    $expect = 'operator|parenthesis_close';
                } else {
                    $expect = 'operator';
                }
            break;
        }
        $position += $offset + strlen($value);
    }
    if ($indent>0) {
        throw new \LogicException('unbalanced parenthesis');
    }
    return implode(' ',$sql);
}
```

If you want, take a look at the code at this point, in the [PHP sandbox.](http://sandbox.onlinephpfunctions.com/code/30d3b55653fc25daf179fbe6e258351a95d4b792)

Finally there are two more checks to see if the query string is correctly parsed. The first is to check that the whole query string is parsed, and no unrecognized tokens are left behind:

```php=
    if ($position<strlen($query)) {
        throw new \LogicException('Parse error at '.$position.': unrecognized token: '
        .(substr($query,0, $position)." --> ".substr($query,$position)) );
    }
```

The second is to check that the query string is complete. If any of the token types `compare`, `string` or `number` are in the expect list, the query is incomplete:

```php=
    foreach(['number','string','compare'] as $tokenType) {
        if (strpos($expect, $tokenType)!==false) {
            throw new \LogicException('Parse error at '.$position.': expected '.$expect.': '
            .(substr($query,0, $position)." --> ".substr($query,$position)) );

        }
    }
```

All that is left is to actually build the SQL string now. In this case we'll only build the `where` clause of the SQL string, the `select` part is not in the scope for the query parser.

To do this, we need to understand how PostgreSQL queries on JSON objects, specifically JSONB, which can be automatically indexed.

The special operators we are going to use are:

Retrieving part of a JSON object:
```
name #>> '{parent,child}'
```

All the compare operators don't need translation, except for  `~=` and `!~`:
```
~=     like
!~     not like
```

In addition when checking if a property is present, the property must be referenced with `#>` instead of `#>>`.

So lets start with the name token. I've skipped the code for `$expect` here for brevity.

```php=
    switch($type) {
        case 'name':
            $sql[] = "objects.data #>> '{".str_replace('.',',',$value)."}'";
        break;
    }
```

All JSON data is stored in the objects table in the column data. The name can be a reference into the JSON object, but it uses `.` as the seperator. Postgres wants `,` instead. I've introduced a new variable `$part` here, because depending on what compare operator comes next, I might have to change the `#>>` into `#>`.

Now for the compare operators:

```php=
    case 'compare':
        switch($value) {
            case '~=':
                $sql[] = 'like';
            break;
            case '!~':
                $sql[] = 'not like';
            break;
            case '?':
                $part = $sql[count($sql)-1];
                $part = str_replace('#>>', '#>', $part);
                $sql[count($sql)-1] = $part;
                $sql[] = $value;
            break;
            default:
                $sql[] = $value;
            break;
        }
    break;
```

Then we get to actual values, numbers and strings and the `and` and `or` operators, and parenthesis::

```php=
    case 'number':
    case 'string':
        $sql[] = $value;
    break;
    case 'operator':
        $sql[] = $value;
    break;
    case 'parenthesis_open': 
        $sql[] = $value;
    break;
    case 'parenthesis_close':
        $sql[] = $value;
    break;
```

Since the query language matches for these cases there's no need to change anything. We can just add the token values to the SQL string.

If you add this all together, you end up with code like the [query parser in ARC/Store](https://github.com/poef/arc-store/blob/master/src/store/PSQLQueryParser.php). Or take a look at [the PHP Sandbox version here.](http://sandbox.onlinephpfunctions.com/code/53d9acab7995c8c5f6c9b8ec4bf0fbf7d7da6afa)

## Parse to PHP code

Transpiling a query language to SQL is nice, but sometimes you just have a bunch of data in an array. It would be nice to have a query language for that as well. So let's build a new parser that transforms the query to a real PHP function we can use with `array_filter`.

The nice thing is that we can re-use the tokenizer as it is. All we need to change is the parser. Let's write a new one, starting of from almost the same point as before:

```php=
function parser($query) {
    $fn = [];
    $part = '';
    foreach( tokenizer($query) as $token) {
        $type = key($token);
        list($value,$offset) = $token[$type];
        if ( !preg_match("/^$expect$/",$type) ) {
            throw new \LogicException('Parse error at '.$position
                .': expected '.$expect.', got '.$type.': '
                .substr($query,0, $position)." --> "
                .substr($query,$position)
            );
        }
        switch($type) {
            // build the function here 
        }
    }
    return createFunction($fn);
}
```

We'll get to `createFunction` later. One thing you may note as well, is that the parser does more than a traditional parser. Normally when you parse code, you convert the string to an intermediate presentation, called an Abstract Syntax Tree, or AST for short. This AST then is the input for a compiler. Since the query language is really tiny, I've skipped that step here.

For this parser we'll start with the data format for the data to filter:

```json=
[
    {
        "key":"value",
        "sub": {
            "key":"value"
        }
    }
]
```

The filter function must be able to work with any valid JSON array of objects, or what is called 'schema-free' data.

If, for example, we have a list of persons with a firstName and lastName and an addres with properties street and city, we should be able to pass a query like this:

```
lastName~="O%" and (address.city = "Manchester")
```

And get a filter function that looks like this:

```php=
function($entry) {
    return preg_match('/^O.*$/',$entry['lastName']) 
    && (
        isset($entry['address']['city'])
        && $entry['address']['city'] == 'Manchester'
    );
}
```

Notice that we do a little more work here. For one we must translate the like operator to a regular expression. The implementation above is not very safe, the string value can contain all kinds of characters that are mapped to special tokens in a regular expression. However, a little known function in PHP is more restrictive and might be a good match: [`fnmatch()`](https://www.php.net/fnmatch)

For safety I've changed the strings from double quoted to single quoted. This means fixing escaped double quotes and escaping single quotes. Oh well. What we gain is that you can't include expressions in single quoted strings.

To simplify code generation I will use the PHP `??` ([null coalescing operator](https://www.php.net/manual/en/migration70.new-features.php#migration70.new-features.null-coalesce-op)) operator instead of `isset()`. The filter function then becomes more like this:

```php=
function($entry) {
    return fnmatch('O*',$entry['lastName']) 
    && ( $entry['address']['city'] ?? null ) == 'Manchester' );
}

```

So lets start with the name token:

```php=
    function convertName($value) {
        return "\$entry['"
             .implode("']['", explode('.',$value))
             ."']";
    }
    
    case 'name':
        $part = convertName($value);
    break;
```

The new function `convertName` transforms a name in the query string from something like `address.street` into `$entry['address']['street']`. There's no need to check for single quotes in the name, as the tokenizer doesn't allow that.

On with the comparisons:

```php=
    function matches($pattern, $value) {
        $pattern = str_replace('%', '*',
            str_replace('*', '\\*', $pattern));
        return fnmatch($pattern, $value);
    }

    case 'compare':
        switch( $value ) {
            case '>':
            case '>=':
            case '<':
            case '<=':
            case '!=':
                $part = '( '.$part. ' ?? null ) '.$value;
            break;
            case '<>':
                $part = '( '.$part. ' ?? null ) !=';
            break;
            case '=':
                $part = '( '.$part. ' ?? null ) ==';
            break;
            case '?':
                $part ='property_exists('.$part.' ?? null,{placeholder})';
            break;
            case '~=':
                $part = 'matches({placeholder},'.$part.' ?? null)';
            break;
            case '!~':
                $part = '!matches({placeholder}',.$part.' ?? null)';
            break;
        }
    break;
```

Instead of directly pushing lines into the `$fn` array, I'm using a temporary variable `$part` here. The PHP code is less of a direct translation and I've opted not to use an AST here, now you see why that may not be a good idea for more complex languages.

In addition, I've added a `{placeholder}` string, so that we can plugin in the value to compare with later.

Let's continue with that part:

```php=
    /**
     * Convert a double quoted string to single quoted
     */
    function convertString($value) {
        return "'".
            str_replace("'","\\'",
                str_replace('\\','',
                    substr($value, 1, strlen($value)-2)
                )
            )
            ."'";
    }

    case 'number':
        if (strpos($part, '{placeholder}')!==false) {
            $fn[] = str_replace('{placeholder}', $value, $part);
        } else {
            $fn[] = $part . $value;
        }
        $part   = ''; // reset
    break;
    case 'string':
        if (strpos($part, '{placeholder}')!==false) {
            $fn[] = str_replace('{placeholder}', convertString($value), $part);
        } else {
            $fn[] = $part . convertString($value);
        }
        $part   = ''; // reset
    break;
```

Now add the operators and parenthesis:

```php=
    case 'operator':
        switch($value) {
            case 'and':
                $fn[] = '&&';
            break;
            case 'or':
                $fn[] = '||';
            break;
        }
    break;
    case 'parenthesis_open':
        $fn[] = $token;
    break;
    case 'parenthesis_close':
        $fn[] = $token;
    break;
```

And finally, if everything has been parsed, we need to combine it and build a PHP function:

```php=
function createFunction($fn) {
    $fn = implode(' ',$fn);
    $f  = eval('return function($entry) { return '.$fn.'; }');
    return $f;
}
```

And to use it, you add some data and use array_filter on it:

```php=
$data = json_decode(<<<EOF
[
    {
        "firstName": "Hilda",
        "lastName": "Ogden",
        "address": {
            "street": "Coronation Street",
            "city": "Manchester"
        }
    },
    {
        "firstName": "Stan",
        "lastName": "Ogden",
        "address": {
            "street": "Other Street",
            "city": "Manchester"
        }
    },
    {
        "firstName": "Kevin",
        "lastName": "Webster",
        "address": {
            "street": "Market Street",
            "city": "Liverpool"
        }
    }
]
EOF
, true);

$f = parser('lastName ~= "O%" and (address.street="Coronation Street")');

$result = array_filter($data, $f);
```

Check to see the full code in [PHP Sandbox here.](http://sandbox.onlinephpfunctions.com/code/b8eebaa7f48da9d3ce440142ee0d48476198c6d7)

> **Wizard rule**
>
> A DSL is a boundary drawn in language. Draw it where the problem already has a natural edge.
