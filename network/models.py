from django.db import models

# Create your models here.
import numpy as np
import scipy as sp
import networkx as nx
import matplotlib.pyplot as plt


class Matrix:
    def __init__(self, n):
        self.n = n
        self.A = np.zeros((n, n))

    def construct(self):
        pass

    def spy(self):
        fig = plt.figure()
        ax = plt.matshow(self.A, fignum=0)
        plt.xticks([])
        plt.yticks([])
        plt.xlabel('Adjacency matrix')
        fig.colorbar(ax)
        plt.show()

    def plot_eigenvalue(self, ax):
        w, _ = np.linalg.eig(self.A)
        w = np.sort(w)
        w = np.around(w, decimals=3)
        x = []
        y = []
        for _w in w:
            _x = _w.real if isinstance(_w, complex) else _w
            _y = _w.imag if isinstance(_w, complex) else 0
            x.append(_x)
            y.append(_y)
        # print(w)
        ax.spines['top'].set_color('none')
        ax.spines['right'].set_color('none')
        ax.xaxis.set_ticks_position('bottom')
        ax.spines['bottom'].set_position(('data', 0))
        ax.yaxis.set_ticks_position('left')
        ax.spines['left'].set_position(('data', 0))
        ax.scatter(x, y, label=str(self.n))
        ax.set_xlabel('Spectrum')
        return w


class RandomMatrix(Matrix):
    def __init__(self, n):
        super().__init__(n)
        self.construct()

    def construct(self):
        """
        random matrix with row sum 1
        """
        self.A = np.random.dirichlet(np.ones(self.n), size=self.n)


class SBMMatrix(Matrix):
    def __init__(self, n, sizes, ps, operator="A"):
        super().__init__(n)
        self.g = None
        self.sizes = sizes
        self.ps = ps
        self.operator = operator
        if len(sizes) == len(ps):
            self.construct()
        else:
            print("Parameter Wrong: please check sizes or ps!")

    def construct(self):
        if self.g is None:
            self.g = nx.stochastic_block_model(sizes=self.sizes, p=self.ps)
        self.change_operator(self.operator)

    def change_operator(self, operator='A', r=0):
        """ operator: A, L, L_rw, L_sym, NB, BH
                r special for BH
        """
        self.operator = operator
        A = nx.to_numpy_array(self.g)
        if self.operator == 'A':
            self.A = A
        elif self.operator == 'L':
            L = np.diag(np.sum(A, 0)) - A
            self.A = L
        elif self.operator == 'L_rw':
            self.A = np.linalg.inv(np.diag(np.sum(A, 0))) @ A
        elif self.operator == 'L_sym':
            D = np.sum(A, 0)
            _D = np.diag(D)
            L = _D @ A @ _D
            self.A = L
        elif self.operator == 'NB':
            edges = []
            x, y = np.where(A == 1)
            for i, x_i in enumerate(x):
                edges.append((x_i, y[i]))
            e = len(edges)
            B = np.zeros((e, e))
            for i in range(len(edges)):
                for j in range(len(edges)):
                    if edges[i][1] == edges[j][0] and edges[i][0] != edges[j][1]:
                        B[i, j] = 1
                    else:
                        B[i, j] = 0
            self.A = B
        elif self.operator == 'BH':
            D = np.sum(A, 0)
            _D = np.diag(D)
            B = np.eye(np.shape(A)[0]) * (r**2 - 1) - r * A + _D
            self.A = B
        else:
            pass
    
    def get_eigen(self):
        w, v = np.linalg.eig(self.A)
        sort_index = np.argsort(w)
        w = w[sort_index]
        v = v[:, sort_index]
        return w, np.transpose(v)


def find_zeta_1(sbm):
    # find sqrt(rho(B))
    d = np.sum(nx.to_numpy_array(sbm.g), 1)
    rho = np.sum(d**2) / np.sum(d)
    border = np.sqrt(rho)
    print("rho", rho, "border", border)
    r = border
    w_0 = None
    w_1 = None
    lambda_0 = None
    lambda_1 = None
    while True:
        sbm.change_operator('BH', r=r)
        w, _ = np.linalg.eig(sbm.A)
        w = np.sort(w)
        w = np.around(w, decimals=3)
        if lambda_0 is None:
            if w_0 is None:
                w_0 = w[0]
            else:
                if (w_0 <= 0 and w[0] >=0) or (w_0 >= 0 and w[0] <= 0):
                    lambda_0 = r
                    print("lambda_0 find!", lambda_0)
                else:
                    w_0 = w[0]
        if lambda_1 is None:
            if w_1 is None:
                w_1 = w[1]
            else:
                if (w_1 <= 0 and w[1] >=0) or (w_1 >= 0 and w[1] <= 0):
                    lambda_1 = r
                    print("lambda_1 find!", lambda_1)
                else:
                    w_1 = w[1]
        if lambda_0 is not None and lambda_1 is not None:
            break
        else:
            r += 0.001
    # print("lambda_0", lambda_0, "lambda_1", lambda_1)
    zeta = lambda_0 / lambda_1
    return zeta


def find_zeta_2(sbm):
    # find sqrt(rho(B))
    d = np.sum(nx.to_numpy_array(sbm.g), 1)
    rho = np.sum(d**2) / np.sum(d)
    border = np.sqrt(rho)
    print("rho", rho, "border", border)

    r = 1
    w_1 = None
    lambda_1 = None
    while True:
        sbm.change_operator('BH', r=r)
        w, _ = np.linalg.eig(sbm.A)
        w = np.sort(w)
        w = np.around(w, decimals=3)
        if lambda_1 is None:
            if w_1 is None:
                w_1 = w[1]
            else:
                if (w_1 <= 0 and w[1] >=0) or (w_1 >= 0 and w[1] <= 0):
                    lambda_1 = r
                    print("lambda_1 find!", lambda_1)
                else:
                    w_1 = w[1]
        if  lambda_1 is not None:
            break
        else:
            r += 0.001
    zeta = lambda_1
    return zeta


def main():
    # hierarchy = generation.create2paramGHRG(n=3**9, snr=25, c_bar=38, n_levels=3, groups_per_level=3)
    # A = hierarchy.sample_network()
    #
    # Laplacian = spectral_operators.Laplacian(A)
    # BethsHessian = spectral_operators.BetheHessian(A)

    # rm = RandomMatrix(5)
    # print(rm.A, np.sum(rm.A))
    # rm.spy()
    # rm.plot_eigenvalue()
    sizes = [25, 25, 25]
    ps = [[0.9, 0.2, 0.1], [0.2, 0.8, 0.3], [0.1, 0.3, 0.9]]
    n = np.sum(sizes)
    sbm = SBMMatrix(n, sizes, ps)
    # sbm.change_operator('NB')
    # sbm.plot_eigenvalue()
    zeta1 = find_zeta_1(sbm)
    print("1st method zeta", zeta1)

    zeta2 = find_zeta_2(sbm)
    print("2nd method zeta", zeta2)

if __name__ == '__main__':
    main()
