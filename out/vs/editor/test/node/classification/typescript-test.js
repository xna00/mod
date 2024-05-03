"use strict";
///
/* eslint-disable */
const x01 = "string";
///         ^^^^^^^^ string
const x02 = '\'';
///         ^^^^ string
const x03 = '\n\'\t';
///         ^^^^^^^^ string
const x04 = 'this is\
///         ^^^^^^^^^ string\
a multiline string';
/// <------------------- string
const x05 = x01; // just some text
///             ^^^^^^^^^^^^^^^^^ comment
const x06 = x05; /* multi
///             ^^^^^^^^ comment
line *comment */
/// <---------------- comment
const x07 = 4 / 5;
const x08 = `howdy`;
///         ^^^^^^^ string
const x09 = `\'\"\``;
///         ^^^^^^^^ string
const x10 = `$[]`;
///         ^^^^^ string
const x11 = `${x07 + /**/ 3}px`;
///         ^^^ string
///                 ^^^^ comment
///                      ^^^^ string
const x12 = `${x07 + (function () { return 5; })() /**/}px`;
///         ^^^ string
///                                               ^^^^ comment
///                                                   ^^^^ string
const x13 = /([\w\-]+)?(#([\w\-]+))?((.([\w\-]+))*)/;
///         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ regex
const x14 = /\./g;
///         ^^^^^ regex
const x15 = Math.abs(x07) / x07; // speed
///                              ^^^^^^^^ comment
const x16 = / x07; /.test('3');
///         ^^^^^^^^ regex
///                       ^^^ string
const x17 = `.monaco-dialog-modal-block${true ? '.dimmed' : ''}`;
///         ^^^^^^^^^^^^^^^^^^^^^^ string
///                                      ^^^^^^^^^ string
///                                                  ^^^^ string
const x18 = Math.min((14 <= 0.5 ? 123 / (2 * 1) : ''.length / (2 - (2 * 1))), 1);
///                                               ^^ string
const x19 = `${3 / '5'.length} km/h)`;
///         ^^^ string
///                ^^^ string
///                          ^^^^^^^ string
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC10ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9ub2RlL2NsYXNzaWZpY2F0aW9uL3R5cGVzY3JpcHQtdGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsR0FBRztBQUNILG9CQUFvQjtBQUNwQixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUM7QUFDckIsMkJBQTJCO0FBRTNCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQztBQUNqQix1QkFBdUI7QUFFdkIsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDO0FBQ3JCLDJCQUEyQjtBQUUzQixNQUFNLEdBQUcsR0FBRzs7bUJBRU8sQ0FBQztBQUNwQiwrQkFBK0I7QUFFL0IsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUEsaUJBQWlCO0FBQ2pDLHlDQUF5QztBQUV6QyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQTs7Z0JBRUE7QUFDaEIsNkJBQTZCO0FBRTdCLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFFbEIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDO0FBQ3BCLDBCQUEwQjtBQUUxQixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUM7QUFDckIsMkJBQTJCO0FBRTNCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQztBQUNsQix3QkFBd0I7QUFFeEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUUsSUFBSSxDQUFBLENBQUMsSUFBSSxDQUFDO0FBQzlCLHNCQUFzQjtBQUN0QixnQ0FBZ0M7QUFDaEMsb0NBQW9DO0FBRXBDLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsY0FBYyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUEsSUFBSSxJQUFJLENBQUM7QUFDM0Qsc0JBQXNCO0FBQ3RCLDhEQUE4RDtBQUM5RCxpRUFBaUU7QUFFakUsTUFBTSxHQUFHLEdBQUcsd0NBQXdDLENBQUM7QUFDckQsMERBQTBEO0FBRTFELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQztBQUNsQix1QkFBdUI7QUFHdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRO0FBQ3pDLGlEQUFpRDtBQUVqRCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLDBCQUEwQjtBQUMxQixvQ0FBb0M7QUFFcEMsTUFBTSxHQUFHLEdBQUcsNkJBQTZCLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNqRSx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELGdFQUFnRTtBQUVoRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNqRiwyREFBMkQ7QUFFM0QsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3RDLHNCQUFzQjtBQUN0Qiw2QkFBNkI7QUFDN0IsMkNBQTJDIn0=