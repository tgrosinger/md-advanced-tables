open Jest
open Expect

let () =
  describe "Point" begin fun () ->
    let open Point in

    describe "equal" begin fun () ->
      testAll "should checks if two points are equal" [
        ({ row = 0; column = 1 }, { row = 0; column = 1}, true);
        ({ row = 0; column = 1 }, { row = 2; column = 1}, false);
        ({ row = 0; column = 1 }, { row = 0; column = 2}, false);
        ({ row = 0; column = 1 }, { row = 2; column = 3}, false);
      ] begin fun (p, q, e) ->
        expect (equal p q) |> toBe e
      end;
    end;

    describe "compare" begin fun () ->
      testAll "should return negative integer if the former is less than the latter" [
        ({ row = 0; column = 0 }, { row = 1; column = 0 });
        ({ row = 0; column = 0 }, { row = 0; column = 1 });
      ] begin fun (p, q) ->
        expect (compare p q) |> toBeLessThan 0
      end;

      testAll "should return positive integer if the former is greater than the latter" [
        ({ row = 1; column = 0 }, { row = 0; column = 0 });
        ({ row = 0; column = 1 }, { row = 0; column = 0 });
      ] begin fun (p, q) ->
        expect (compare p q) |> toBeGreaterThan 0
      end;

      test "should return zero if two points are equal" begin fun () ->
        let p = { row = 0; column = 1} in
        let q = { row = 0; column = 1} in
        expect (compare p q) |> toBe 0
      end;
    end;
  end
