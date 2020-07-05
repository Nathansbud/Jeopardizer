#!/usr/bin/env python3.7

import os
import json

def make_customs(overwrite, question_count):
    path = os.path.join(os.path.dirname(__file__), "..", "process")
    custom_path = os.path.join(os.path.dirname(__file__), "..", "questions", "custom")

    for file in os.listdir(path):
        with open(path + file, "r") as custom:
            categories = custom.readlines()
            json_add = []
            for category in categories:
                cat = [qa.strip() for qa in category.split("|")]
                questions = cat[1::2]
                answers = cat[2::2]

                if len(questions) == len(answers) == question_count:
                    qa_set = []
                    for i in range(len(questions)):
                        qa_set.append(
                            {
                                "Question":questions[i],
                                "Answer":answers[i]
                            }
                        )

                    json_add.append(
                        {
                            "Category":cat[0],
                            "Clues":qa_set
                        }
                    )
                else:
                    print("Excluded category due to incorrect question count: ")
                    print(cat)

            exists = os.path.isfile(custom_path + file[:file.rfind(".")] + ".json")
            if not exists or overwrite:
                print("Made category file from " + file)
                with open(custom_path + file[:file.rfind(".")] + ".json", "w+") as custom_json:
                    json.dump(json_add, custom_json)
            else:
                print("File already exists, did not overwrite!")

if __name__ == "__main__":
    make_customs(True, 5)
    pass
