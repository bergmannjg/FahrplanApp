#r "nuget:FSharp.Data"

open System.Text.Json
open FSharp.Data

type RailwayNetwork = {
    Line: int;
    StartStation: string;
    EndStation: string;
    Trains: string list;
}

let loadLine (nr:int) = 
    let url = $"https://www.fernbahn.de/datenbank/suche/?fahrplan_jahr=2023&zug_linie={nr}&fv_suche_detail=1"

    let results : HtmlDocument = HtmlDocument.Load(url)

    results.Descendants [ "tr" ]
    |> Seq.map (fun r -> 
            r.Descendants [ "td" ]
            |> Seq.map (fun x -> x.InnerText())
            |> Seq.toArray)
    |> Seq.toList
    |> List.filter (fun r -> r.Length > 5)
    |> List.map (fun r ->r.[2], r.[3], r.[4], r.[5])
    |> List.groupBy (fun (_,_,f,t) -> f,t)
    |> List.map (fun ((f,t),l) -> {Line=nr;StartStation=f;EndStation=t;
                    Trains=l|>List.map(fun (trainType,trainNr,_,_) -> trainType + trainNr) } )

let lines =
    [ 10; 11; 12; 13; 14; 15; 75; 76; 77 ]
    |> List.collect (fun nr -> loadLine nr)

printfn "%s" (JsonSerializer.Serialize lines)
