import unittest

import numpy as np

from src.services import model_store


class _Scaler:
    def transform(self, features):
        return features


class _LabelEncoder:
    classes_ = np.array(["wheat", "tomato", "rice"])


class _Model:
    def __init__(self):
        self._probs = np.array([[0.2, 0.7, 0.1]])
        self._contrib = np.array(
            [
                [
                    0.30,
                    0.20,
                    -0.10,
                    0.05,
                    0.04,
                    0.02,
                    0.01,
                    0.50,
                    -0.10,
                    0.05,
                    0.03,
                    0.02,
                    0.01,
                    0.00,
                    0.20,
                    0.08,
                    0.06,
                    0.04,
                    0.03,
                    0.02,
                    0.01,
                    0.10,
                    0.02,
                    0.01,
                ]
            ]
        )

    def predict(self, _, pred_contrib=False):
        if pred_contrib:
            return self._contrib
        return self._probs


class ModelStoreTests(unittest.TestCase):
    def setUp(self):
        self.original_model = model_store._model
        self.original_scaler = model_store._scaler
        self.original_encoder = model_store._label_encoder
        self.original_feature_names = model_store._feature_names

        model_store._model = _Model()
        model_store._scaler = _Scaler()
        model_store._label_encoder = _LabelEncoder()
        model_store._feature_names = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

        self.payload = {
            "N": 70.0,
            "P": 45.0,
            "K": 51.0,
            "temperature": 24.5,
            "humidity": 62.0,
            "ph": 6.4,
            "rainfall": 320.0,
        }

    def tearDown(self):
        model_store._model = self.original_model
        model_store._scaler = self.original_scaler
        model_store._label_encoder = self.original_encoder
        model_store._feature_names = self.original_feature_names

    def test_recommend_with_explanations_returns_top_n_and_positive_sorted_contributions(self):
        recommendations = model_store.recommend_with_explanations(self.payload, top_n=2, top_features=3)
        self.assertEqual(len(recommendations), 2)
        self.assertEqual(recommendations[0]["crop"], "tomato")
        self.assertAlmostEqual(recommendations[0]["probability"], 70.0)
        self.assertLessEqual(len(recommendations[0]["contributions"]), 3)

        contribs = recommendations[0]["contributions"]
        for contrib in contribs:
            self.assertGreater(contrib["score"], 0)
            self.assertIn(contrib["feature"], self.payload)
            self.assertAlmostEqual(contrib["raw_value"], self.payload[contrib["feature"]])

        if len(contribs) >= 2:
            self.assertGreaterEqual(contribs[0]["score"], contribs[1]["score"])
        if len(contribs) >= 3:
            self.assertGreaterEqual(contribs[1]["score"], contribs[2]["score"])

    def test_recommend_raises_on_missing_features(self):
        with self.assertRaises(ValueError):
            model_store.recommend_with_explanations({"N": 1.0}, top_n=1)


if __name__ == "__main__":
    unittest.main()
