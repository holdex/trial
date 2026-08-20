// Fills the placeholders in a message before it is posted to a candidate.
//
// One pass, and every value goes in as data. A value holding `${...}` is not
// read as another placeholder, and one holding `$&` is not read as a
// replacement pattern, both of which a chain of `replaceAll` calls would do.
// That matters because some of these values come out of an issue body the
// candidate wrote.

/** `${name}` becomes `values.name`. An unknown placeholder is left alone. */
function fill(template, values) {
  return template.replace(/\$\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : placeholder
  );
}

/** The comment a candidate gets once their profile has merged. */
const renderHandover = (template, user) => fill(template, { user });

module.exports = { fill, renderHandover };
